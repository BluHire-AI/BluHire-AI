import whisper
import os
import shutil
import asyncio
import subprocess
from functools import partial
from typing import Dict, Any

def _ensure_ffmpeg_available() -> str:
    """
    Detects whether ffmpeg is available.
    If not on PATH, locates the bundled imageio-ffmpeg binary, creates ffmpeg.exe if needed,
    and prepends the directory to PATH. Verifies execution with 'ffmpeg -version'.
    """
    # 1. Try existing PATH
    try:
        res = subprocess.run(["ffmpeg", "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0:
            print("[TranscriptionService] System ffmpeg found and verified.")
            return "system"
    except Exception:
        pass

    # 2. Check imageio_ffmpeg
    try:
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        bin_dir = os.path.dirname(ffmpeg_exe)

        # Whisper specifically executes 'ffmpeg', so ensure ffmpeg.exe exists in that directory
        standard_ffmpeg = os.path.join(bin_dir, "ffmpeg.exe" if os.name == "nt" else "ffmpeg")
        if not os.path.exists(standard_ffmpeg):
            shutil.copy(ffmpeg_exe, standard_ffmpeg)
            print(f"[TranscriptionService] Copied {ffmpeg_exe} -> {standard_ffmpeg}")

        # Prepend to PATH
        os.environ["PATH"] = bin_dir + os.pathsep + os.environ.get("PATH", "")

        # 3. Verify execution
        verify_res = subprocess.run(["ffmpeg", "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if verify_res.returncode == 0:
            print(f"[TranscriptionService] Bundled ffmpeg initialized & verified at: {bin_dir}")
            return standard_ffmpeg
        else:
            print(f"[TranscriptionService] Warning: ffmpeg exited with code {verify_res.returncode}")
    except Exception as err:
        print(f"[TranscriptionService] Could not initialize imageio-ffmpeg: {err}")

    return "unavailable"

class TranscriptionService:
    def __init__(self):
        # 1. Ensure ffmpeg is fully verified before loading Whisper
        self.ffmpeg_status = _ensure_ffmpeg_available()

        # 2. Load model once at startup — 'base' model
        print("[TranscriptionService] Loading Whisper 'base' model...")
        self.model = whisper.load_model("base")
        print("[TranscriptionService] Model loaded successfully.")

    async def transcribe(self, file_path: str) -> Dict[str, Any]:
        """
        Transcribes an audio/video file using Whisper.
        Returns:
            {
                "success": True/False,
                "transcript": "<spoken words>",
                "error": None or "<error message>"
            }
        """
        if not os.path.exists(file_path):
            return {
                "success": False,
                "transcript": "",
                "error": f"Recording file not found on disk: {file_path}"
            }

        file_size = os.path.getsize(file_path)
        if file_size == 0:
            return {
                "success": False,
                "transcript": "",
                "error": "Recording file is empty (0 bytes)."
            }

        print(f"[TranscriptionService] Starting transcription: {file_path} (size: {file_size} bytes)")

        loop = asyncio.get_event_loop()
        try:
            result = await loop.run_in_executor(
                None,
                partial(self.model.transcribe, file_path, fp16=False)
            )
            text = result.get("text", "").strip()
            print(f"[TranscriptionService] Transcription complete. Length: {len(text)} chars")
            return {
                "success": True,
                "transcript": text,
                "error": None
            }
        except Exception as e:
            err_msg = str(e)
            print(f"[TranscriptionService] Whisper processing failed: {err_msg}")
            return {
                "success": False,
                "transcript": "",
                "error": f"Whisper transcription failed: {err_msg}"
            }

transcription_service = TranscriptionService()
