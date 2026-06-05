import os
import httpx
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()


class OpenRouterClient:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY", "").strip()

        if not self.api_key:
            raise ValueError(
                "OPENROUTER_API_KEY is missing from environment variables"
            )

        self.default_model = os.getenv(
            "OPENROUTER_MODEL",
            "openrouter/auto"
        ).strip()

        self.api_url = "https://openrouter.ai/api/v1/chat/completions"

    async def get_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        response_format_json: bool = False
    ) -> str:

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://bluehire.ai",
            "X-Title": "HRMinds AI Sourcing",
            "Content-Type": "application/json"
        }

        models_to_try = [
            self.default_model
        ]

        last_error = None

        for model in models_to_try:
            print(f"[OpenRouter] Attempting completion using model: {model}")

            payload: Dict[str, Any] = {
                "model": model,
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": user_prompt
                    }
                ],
                "temperature": 0.2
            }

            if response_format_json:
                payload["response_format"] = {
                    "type": "json_object"
                }

            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        self.api_url,
                        headers=headers,
                        json=payload
                    )

                    if response.status_code == 200:
                        data = response.json()

                        if (
                            "choices" in data
                            and len(data["choices"]) > 0
                        ):
                            actual_model = data.get("model", model)

                            print(
                                f"[OpenRouter] Success "
                                f"requested={model} "
                                f"actual={actual_model}"
                            )

                            return data["choices"][0]["message"]["content"]

                        last_error = f"Empty choices returned: {data}"

                        print(
                            f"[OpenRouter] Empty choices. "
                            f"Response: {data}"
                        )

                    else:
                        last_error = (
                            f"API error status "
                            f"{response.status_code}: "
                            f"{response.text}"
                        )

                        print(
                            f"[OpenRouter] Failed. "
                            f"Status={response.status_code} "
                            f"Response={response.text}"
                        )

            except Exception as e:
                last_error = f"Connection error: {str(e)}"

                print(
                    f"[OpenRouter] Connection error: {str(e)}"
                )

        raise Exception(
            f"OpenRouter call failed. Last error: {last_error}"
        )


open_router_client = OpenRouterClient()