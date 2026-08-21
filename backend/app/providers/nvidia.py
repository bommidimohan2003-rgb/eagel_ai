import asyncio
import json
from typing import Any, AsyncGenerator, Dict, List, Optional
import httpx
from app.core.config import settings
from app.core.exceptions import AIProviderError
from app.core.logging import logger
from app.providers.base import AIProvider


class NVIDIAProvider(AIProvider):
    """
    AI provider implementation supporting NVIDIA Nemotron models.
    Supports both direct NVIDIA API and OpenRouter endpoints seamlessly.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        default_model: Optional[str] = None,
    ):
        self.api_key = api_key or settings.NVIDIA_API_KEY
        raw_url = base_url or settings.NVIDIA_BASE_URL
        
        # If API key is an OpenRouter key (sk-or-v1-...) and base_url is still default nvidia, auto-switch to openrouter
        if self.api_key and self.api_key.startswith("sk-or-") and "nvidia.com" in raw_url:
            raw_url = "https://openrouter.ai/api/v1"

        self.base_url = raw_url.rstrip("/")
        self.default_model = default_model or settings.NVIDIA_MODEL

    @property
    def provider_name(self) -> str:
        return "nvidia"

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        if "openrouter.ai" in self.base_url:
            headers["HTTP-Referer"] = "http://localhost:3000"
            headers["X-Title"] = "Personal AI Assistant"
        return headers

    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        temperature: float = 0.6,
        top_p: float = 0.9,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        target_model = model or self.default_model

        if not self.api_key:
            return {
                "role": "assistant",
                "content": "API Key is missing. Please set `NVIDIA_API_KEY` in your backend `.env` file.",
                "model": target_model,
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            }

        payload: Dict[str, Any] = {
            "model": target_model,
            "messages": messages,
            "temperature": temperature,
            "top_p": top_p,
            "max_tokens": max_tokens,
            "stream": False,
        }
        if tools:
            payload["tools"] = tools

        url = f"{self.base_url}/chat/completions"
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(url, headers=self._get_headers(), json=payload)
                if response.status_code != 200:
                    error_detail = response.text
                    logger.error(f"AI Provider Error [{response.status_code}]: {error_detail}")
                    raise AIProviderError(f"AI Provider Error ({response.status_code}): {error_detail}")

                data = response.json()
                choice = data.get("choices", [{}])[0]
                message = choice.get("message", {})
                return {
                    "role": message.get("role", "assistant"),
                    "content": message.get("content", ""),
                    "model": data.get("model", target_model),
                    "usage": data.get("usage", {}),
                }
        except httpx.RequestError as exc:
            logger.error(f"Network error communicating with AI API: {str(exc)}")
            raise AIProviderError(f"Network error contacting AI API: {str(exc)}")

    async def stream_response(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        temperature: float = 0.6,
        top_p: float = 0.9,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        target_model = model or self.default_model

        if not self.api_key:
            sample_msg = "Please configure your API key in `backend/.env`."
            for word in sample_msg.split(" "):
                yield {"type": "text_delta", "content": word + " "}
                await asyncio.sleep(0.04)
            return

        payload: Dict[str, Any] = {
            "model": target_model,
            "messages": messages,
            "temperature": temperature,
            "top_p": top_p,
            "max_tokens": max_tokens,
            "stream": True,
            "stream_options": {"include_usage": True},
        }
        if tools:
            payload["tools"] = tools

        url = f"{self.base_url}/chat/completions"

        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                async with client.stream("POST", url, headers=self._get_headers(), json=payload) as response:
                    if response.status_code != 200:
                        err_body = await response.aread()
                        err_msg = err_body.decode("utf-8", errors="replace")
                        logger.error(f"AI Provider Stream Error [{response.status_code}]: {err_msg}")
                        yield {
                            "type": "error",
                            "content": f"AI Provider Error [{response.status_code}]: {err_msg}",
                        }
                        return

                    async for line in response.aiter_lines():
                        if not line or not line.strip():
                            continue

                        line_str = line.strip()
                        if line_str.startswith("data:"):
                            data_content = line_str[len("data:") :].strip()
                            if data_content == "[DONE]":
                                break

                            try:
                                chunk = json.loads(data_content)
                                choices = chunk.get("choices", [])
                                if choices:
                                    delta = choices[0].get("delta", {})
                                    
                                    # Handle reasoning/thinking delta
                                    if "reasoning_content" in delta and delta["reasoning_content"]:
                                        yield {
                                            "type": "thinking_delta",
                                            "content": delta["reasoning_content"],
                                        }
                                    
                                    # Standard text delta
                                    if "content" in delta and delta["content"]:
                                        yield {
                                            "type": "text_delta",
                                            "content": delta["content"],
                                        }

                                    # Tool calls
                                    if "tool_calls" in delta and delta["tool_calls"]:
                                        yield {
                                            "type": "tool_call_delta",
                                            "content": delta["tool_calls"],
                                        }

                                # Usage metrics in streaming chunk
                                if "usage" in chunk and chunk["usage"]:
                                    yield {
                                        "type": "usage",
                                        "usage": chunk["usage"],
                                    }

                            except json.JSONDecodeError:
                                logger.debug(f"Skipping non-JSON SSE line: {line_str}")
                                continue

        except httpx.RequestError as exc:
            logger.error(f"Network error during stream: {str(exc)}")
            yield {"type": "error", "content": f"Network error during stream: {str(exc)}"}
        except Exception as exc:
            logger.error(f"Unexpected error during stream: {str(exc)}", exc_info=True)
            yield {"type": "error", "content": f"Stream generation failed: {str(exc)}"}

    async def health_check(self) -> bool:
        if not self.api_key:
            return False
        try:
            url = f"{self.base_url}/models"
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=self._get_headers())
                return res.status_code == 200
        except Exception:
            return False
