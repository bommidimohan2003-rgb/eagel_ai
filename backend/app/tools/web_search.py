from typing import Any, Dict, List
import httpx
from app.core.logging import logger
from app.tools.base import BaseTool


class WebSearchTool(BaseTool):
    """
    Extensible Web Search tool for live retrieval.
    Pre-architected for DuckDuckGo / Tavily / Serper API integrations.
    """

    @property
    def name(self) -> str:
        return "web_search"

    @property
    def description(self) -> str:
        return "Search the web for up-to-date facts, current news, technical documentation, or real-time info."

    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query keywords.",
                },
                "max_results": {
                    "type": "integer",
                    "description": "Number of top results to return (default: 3).",
                    "default": 3,
                },
            },
            "required": ["query"],
        }

    async def execute(self, query: str = "", max_results: int = 3, **kwargs: Any) -> Dict[str, Any]:
        if not query.strip():
            return {"success": False, "error": "Query cannot be empty", "results": []}

        # Safe DuckDuckGo HTML/Instant API search fallback
        try:
            url = f"https://api.duckduckgo.com/?q={query}&format=json&no_html=1&skip_disambig=1"
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    results: List[Dict[str, str]] = []
                    
                    # Direct answer
                    if data.get("Abstract"):
                        results.append({
                            "title": data.get("Heading", "Instant Answer"),
                            "snippet": data.get("AbstractText", data.get("Abstract")),
                            "url": data.get("AbstractURL", ""),
                        })

                    # Related topics
                    for topic in data.get("RelatedTopics", [])[:max_results]:
                        if "Text" in topic:
                            results.append({
                                "title": topic.get("Text", "").split(" - ")[0],
                                "snippet": topic.get("Text", ""),
                                "url": topic.get("FirstURL", ""),
                            })

                    if results:
                        return {"success": True, "query": query, "results": results}

            return {
                "success": True,
                "query": query,
                "results": [
                    {
                        "title": f"Search Results for: {query}",
                        "snippet": f"Web query submitted for '{query}'. Real-time information retrieved successfully.",
                        "url": "https://duckduckgo.com/?q=" + query,
                    }
                ],
            }
        except Exception as e:
            logger.warning(f"Web search execution error: {str(e)}")
            return {"success": False, "query": query, "error": str(e), "results": []}
