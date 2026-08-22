from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ChatMessageInput(BaseModel):
    role: str
    content: str


class ChatStreamRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    mode: Optional[str] = "chat"  # "chat" | "image" | "auto"
    aspect_ratio: Optional[str] = "1:1"
    style: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    max_tokens: Optional[int] = None
    system_prompt: Optional[str] = None
    enable_memory: Optional[bool] = None
    enable_web_search: Optional[bool] = None
    file_ids: Optional[List[str]] = None


class GenerateTitleRequest(BaseModel):
    conversation_id: str
    first_message: str


class GenerateTitleResponse(BaseModel):
    title: str


class StreamEvent(BaseModel):
    event: str  # "start", "text_delta", "thinking_delta", "message_id", "title", "done", "error"
    data: Any
