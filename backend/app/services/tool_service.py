from typing import Any, Dict, List, Optional
from app.core.logging import logger
from app.tools.base import BaseTool
from app.tools.calculator import CalculatorTool
from app.tools.datetime_tool import DateTimeTool
from app.tools.web_search import WebSearchTool


class ToolService:
    """
    Central registry and execution manager for AI tools.
    """

    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self.register_default_tools()

    def register_tool(self, tool: BaseTool) -> None:
        self._tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")

    def register_default_tools(self) -> None:
        self.register_tool(CalculatorTool())
        self.register_tool(DateTimeTool())
        self.register_tool(WebSearchTool())

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def get_all_tool_definitions(self) -> List[Dict[str, Any]]:
        return [tool.to_openai_tool() for tool in self._tools.values()]

    async def execute_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        tool = self.get_tool(name)
        if not tool:
            return {"success": False, "error": f"Tool '{name}' not found"}
        try:
            return await tool.execute(**arguments)
        except Exception as e:
            logger.error(f"Error executing tool {name}: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}


tool_service = ToolService()
