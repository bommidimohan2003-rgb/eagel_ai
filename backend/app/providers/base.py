from abc import ABC, abstractmethod
from typing import Any, AsyncGenerator, Dict, List, Optional


class AIProvider(ABC):
    """
    Abstract interface for AI model providers (NVIDIA, OpenAI, Anthropic, etc.)
    Ensures modularity so additional model providers can be added without rewriting the application.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        temperature: float = 0.6,
        top_p: float = 0.9,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Generate non-streamed complete response.
        """
        pass

    @abstractmethod
    async def stream_response(
        self,
        messages: List[Dict[str, Any]],
        model: Optional[str] = None,
        temperature: float = 0.6,
        top_p: float = 0.9,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Generate streamed response yielding chunk dictionaries:
        {"type": "text_delta" | "thinking_delta" | "tool_call" | "usage" | "error", "content": ...}
        """
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """
        Check if the provider API is accessible and authenticated.
        """
        pass
