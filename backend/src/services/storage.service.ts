import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const TEMP_DIR = path.join(UPLOADS_DIR, 'temp');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');

export class StorageService {
  /**
   * Appends a chunk to the temporary chunk directory (handled by multer).
   * This method verifies the chunk exists and tracks progress.
   */
  async trackChunkProgress(fileId: string, totalChunks: number): Promise<{ received: number; isComplete: boolean }> {
    let receivedChunks = 0;
    
    // Check how many chunks exist for this fileId
    for (let i = 0; i < totalChunks; i++) {
      if (fs.existsSync(path.join(TEMP_DIR, `${fileId}_${i}`))) {
        receivedChunks++;
      }
    }

    return {
      received: receivedChunks,
      isComplete: receivedChunks === totalChunks
    };
  }

  /**
   * Merges all chunks into a single video file.
   */
  async mergeChunks(fileId: string, fileName: string, totalChunks: number): Promise<string> {
    const finalFilePath = path.join(VIDEOS_DIR, `${fileId}_${fileName}`);
    const writeStream = fs.createWriteStream(finalFilePath);

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(TEMP_DIR, `${fileId}_${i}`);
      
      if (!fs.existsSync(chunkPath)) {
        writeStream.end();
        // Clean up partial merge
        if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
        throw new Error(`Missing chunk index ${i} for file ${fileId}`);
      }

      const chunkData = fs.readFileSync(chunkPath);
      writeStream.write(chunkData);
      
      // Cleanup chunk after appending
      fs.unlinkSync(chunkPath);
    }

    writeStream.end();
    
    // Return relative path to be stored in DB
    return `/uploads/videos/${fileId}_${fileName}`;
  }

  /**
   * Delete a video file if needed (e.g. upload failed, retrying)
   */
  async deleteFile(filePath: string): Promise<void> {
    const absolutePath = path.join(__dirname, '../../', filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  }
}

export const storageService = new StorageService();
