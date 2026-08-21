from typing import Any, Dict, List, Optional
from app.models.message import Message
from app.models.memory import Memory
from app.models.file import File
from app.models.user_settings import UserSettings
from app.prompts.system_prompt import DEFAULT_SYSTEM_PROMPT


class ContextBuilder:
    """
    Builds the complete message payload for LLM completion / streaming.
    Combines:
    - System prompt (default or user override)
    - Stored long-term user memories
    - Attached document context (RAG / Direct injection)
    - Sliding window of recent conversation history
    - Current user message
    """

    def __init__(self, max_history_messages: int = 20):
        self.max_history_messages = max_history_messages

    def build_context(
        self,
        current_message: str,
        history: List[Message],
        settings: Optional[UserSettings] = None,
        memories: Optional[List[Memory]] = None,
        files: Optional[List[File]] = None,
        system_prompt_override: Optional[str] = None,
    ) -> List[Dict[str, str]]:
        messages: List[Dict[str, str]] = []

        # 1. Base System Prompt
        base_prompt = system_prompt_override or (settings.system_prompt_override if settings else None) or DEFAULT_SYSTEM_PROMPT
        prompt_sections = [base_prompt]

        # 2. Inject User Long-Term Memories if enabled
        if (settings is None or settings.memory_enabled) and memories:
            memory_texts = [f"- [{m.category.upper()}] {m.content}" for m in memories]
            prompt_sections.append(
                "USER PREFERENCES & DURABLE MEMORY:\n" + "\n".join(memory_texts)
            )

        # 3. Inject Attached Document Context
        if files:
            file_sections = []
            for f in files:
                if f.extracted_text:
                    # Truncate text per file if very large
                    truncated_text = f.extracted_text[:4000]
                    file_sections.append(f"--- Document: {f.original_filename} ---\n{truncated_text}\n--- End Document ---")
            if file_sections:
                prompt_sections.append("ATTACHED REFERENCE DOCUMENTS:\n" + "\n\n".join(file_sections))

        # Assemble full system message
        full_system_content = "\n\n".join(prompt_sections)
        messages.append({"role": "system", "content": full_system_content})

        # 4. Recent Conversation History (Sliding Window)
        recent_history = history[-self.max_history_messages :] if history else []
        for msg in recent_history:
            if msg.role in ["user", "assistant", "system", "tool"]:
                messages.append({"role": msg.role, "content": msg.content})

        # 5. Current User Message (if not already the last message in history)
        if not recent_history or recent_history[-1].content != current_message:
            messages.append({"role": "user", "content": current_message})

        return messages
