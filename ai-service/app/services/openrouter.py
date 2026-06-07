import os
import httpx
import json
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

        print(f"[OpenRouter] API Key initialized: {'exists' if self.api_key else 'missing'}")
        print(f"[OpenRouter] Default model: {self.default_model}")

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

        fallbacks = [
            "google/gemma-2-9b-it:free",
            "meta-llama/llama-3-8b-instruct:free",
            "openchat/openchat-7b:free"
        ]
        models_to_try = [self.default_model]
        for fb in fallbacks:
            if fb != self.default_model:
                models_to_try.append(fb)

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
                        print(f"[OpenRouter] Raw Response:\n{json.dumps(data, indent=2)}")

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

    async def get_chat_completion(
        self,
        messages: list,
        tools: list = None,
        tool_choice: Any = None
    ) -> Dict[str, Any]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://bluehire.ai",
            "X-Title": "HRMinds AI Sourcing",
            "Content-Type": "application/json"
        }

        payload: Dict[str, Any] = {
            "model": self.default_model,
            "messages": messages,
            "temperature": 0.2
        }
        if tools:
            payload["tools"] = tools
        if tool_choice:
            payload["tool_choice"] = tool_choice

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self.api_url,
                headers=headers,
                json=payload
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"OpenRouter API error status {response.status_code}: {response.text}")

    async def stream_chat_completion(
        self,
        messages: list,
        tools: list = None
    ):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://bluehire.ai",
            "X-Title": "HRMinds AI Sourcing",
            "Content-Type": "application/json"
        }

        payload: Dict[str, Any] = {
            "model": self.default_model,
            "messages": messages,
            "temperature": 0.2,
            "stream": True
        }
        if tools:
            payload["tools"] = tools

        async def generator():
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    self.api_url,
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status_code != 200:
                        yield f"data: {json.dumps({'error': f'OpenRouter stream error status {response.status_code}'})}\n\n"
                        return

                    async for line in response.aiter_lines():
                        if line.strip():
                            yield f"{line}\n\n"

        return generator()


open_router_client = OpenRouterClient()