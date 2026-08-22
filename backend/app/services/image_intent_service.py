from enum import Enum
import re
from typing import Any, Dict, Optional
from app.core.logging import logger


class IntentType(str, Enum):
    TEXT = "TEXT"
    IMAGE_GENERATION = "IMAGE_GENERATION"
    IMAGE_EDIT = "IMAGE_EDIT"
    IMAGE_ANALYSIS = "IMAGE_ANALYSIS"
    UNKNOWN = "UNKNOWN"


class ImageIntentService:
    """
    Classifies user message intent into TEXT, IMAGE_GENERATION, IMAGE_EDIT, or IMAGE_ANALYSIS.
    Uses fast deterministic heuristics with regex patterns and semantic extraction.
    """

    # Image generation trigger keywords and regex patterns
    _GENERATE_PATTERNS = [
        r"^(?:generate|create|draw|make|paint|render|produce|visualize|illustrate|design)\s+(?:an?\s+)?(?:image|photo|picture|drawing|illustration|render|portrait|wallpaper|painting|artwork|graphic|banner|logo|concept\s+art)",
        r"(?:generate|create|draw|make|paint|render|produce|visualize|illustrate)\s+(?:an?\s+)?(?:image|photo|picture|artwork)\s+(?:of|showing|depicting|with|for)",
        r"(?:photo|image|picture|drawing|illustration|artwork|painting)\s+of\s+",
        r"^(?:generate|create|draw|paint)\s+me\s+(?:an?\s+)?",
        r"^show\s+me\s+(?:an?\s+)?(?:image|photo|picture|drawing|render)\s+of",
    ]

    _EDIT_PATTERNS = [
        r"^(?:edit|modify|change|adjust|update|tweak|replace|remove|add\s+to)\s+(?:this|the|that)\s+image",
        r"^(?:make\s+it|make\s+the\s+image)\s+(?:darker|brighter|more|less|into|like|look)",
        r"(?:remove|change)\s+the\s+background",
        r"(?:inpaint|outpaint|upscale)\s+this",
    ]

    _ANALYSIS_PATTERNS = [
        r"^(?:what(?:'s|\s+is)\s+in|describe|explain|analyze|read|extract\s+text\s+from)\s+(?:this|the|that)\s+(?:image|picture|photo|diagram|screenshot)",
        r"^(?:what\s+do\s+you\s+see\s+in|tell\s+me\s+about)\s+(?:this|the)\s+image",
    ]

    @classmethod
    def detect_intent(cls, message: str) -> Dict[str, Any]:
        """
        Determines intent and extracts normalized clean prompt.
        """
        cleaned = message.strip()
        if not cleaned:
            return {"intent": IntentType.TEXT, "prompt": cleaned, "confidence": 1.0}

        cleaned_lower = cleaned.lower()

        # 1. Check Image Analysis
        for pattern in cls._ANALYSIS_PATTERNS:
            if re.search(pattern, cleaned_lower):
                return {
                    "intent": IntentType.IMAGE_ANALYSIS,
                    "prompt": cleaned,
                    "confidence": 0.95,
                }

        # 2. Check Image Edit
        for pattern in cls._EDIT_PATTERNS:
            if re.search(pattern, cleaned_lower):
                return {
                    "intent": IntentType.IMAGE_EDIT,
                    "prompt": cleaned,
                    "confidence": 0.9,
                }

        # 3. Check Image Generation
        for pattern in cls._GENERATE_PATTERNS:
            match = re.search(pattern, cleaned_lower)
            if match:
                # Extract subject prompt after trigger words
                extracted_prompt = cleaned
                prefix = match.group(0)
                # Keep prompt descriptive
                logger.info(f"Intent classified as IMAGE_GENERATION for pattern: {pattern}")
                return {
                    "intent": IntentType.IMAGE_GENERATION,
                    "prompt": extracted_prompt,
                    "confidence": 0.95,
                }

        # Explicit shorthand checks
        if any(
            cleaned_lower.startswith(prefix)
            for prefix in [
                "image of ",
                "photo of ",
                "picture of ",
                "drawing of ",
                "painting of ",
                "illustration of ",
            ]
        ):
            return {
                "intent": IntentType.IMAGE_GENERATION,
                "prompt": cleaned,
                "confidence": 0.9,
            }

        return {
            "intent": IntentType.TEXT,
            "prompt": cleaned,
            "confidence": 0.95,
        }
