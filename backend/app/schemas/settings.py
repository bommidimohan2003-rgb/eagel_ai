from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class UserSettingsBase(BaseModel):
    system_prompt_override: Optional[str] = None
    model_name: str = "nvidia/nemotron-3-ultra-550b-a55b"
    temperature: float = Field(default=0.6, ge=0.0, le=2.0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    max_tokens: int = Field(default=4096, ge=128, le=8192)
    reasoning_mode: str = Field(default="auto", description="on, off, auto")
    memory_enabled: bool = True
    web_search_enabled: bool = False
    theme: str = "dark"


class UserSettingsUpdate(BaseModel):
    system_prompt_override: Optional[str] = None
    model_name: Optional[str] = None
    temperature: Optional[float] = Field(default=None, ge=0.0, le=2.0)
    top_p: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    max_tokens: Optional[int] = Field(default=None, ge=128, le=8192)
    reasoning_mode: Optional[str] = None
    memory_enabled: Optional[bool] = None
    web_search_enabled: Optional[bool] = None
    theme: Optional[str] = None


class UserSettingsResponse(UserSettingsBase):
    id: str
    user_id: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
