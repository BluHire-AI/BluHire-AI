import os
import json
import httpx
from typing import Dict, Any, List
from .ai_provider import AIProvider

class OpenRouterProvider(AIProvider):
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.base_url = "https://openrouter.ai/api/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://bluhire.ai", # Change to actual domain
            "X-Title": "BluHire-AI",
            "Content-Type": "application/json"
        }

    async def generate_completion(self, prompt: str, model: str) -> str:
        async with httpx.AsyncClient() as client:
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}]
            }
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

    async def generate_json(self, messages: List[Dict[str, str]], model: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            payload = {
                "model": model,
                "messages": messages,
                "response_format": {"type": "json_object"}
            }
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                # Handle cases where the model wraps JSON in markdown code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                    return json.loads(content)
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                    return json.loads(content)
                raise ValueError("Failed to parse JSON response from OpenRouter.")
