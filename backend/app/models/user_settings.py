from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.user import User


class UserSettings(Base, TimestampMixin):
    __tablename__ = "user_settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    
    # AI Customization
    system_prompt_override: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    model_name: Mapped[str] = mapped_column(String(100), default="nvidia/nemotron-3-ultra-550b-a55b", nullable=False)
    temperature: Mapped[float] = mapped_column(Float, default=0.6, nullable=False)
    top_p: Mapped[float] = mapped_column(Float, default=0.9, nullable=False)
    max_tokens: Mapped[int] = mapped_column(Integer, default=4096, nullable=False)
    reasoning_mode: Mapped[str] = mapped_column(String(20), default="auto", nullable=False)  # "on", "off", "auto"
    
    # Feature flags
    memory_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    web_search_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # UI Preferences
    theme: Mapped[str] = mapped_column(String(20), default="dark", nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="settings")
