import ast
import operator as op
from typing import Any, Dict
from app.tools.base import BaseTool

# Supported mathematical operators for safe evaluation
OPERATORS = {
    ast.Add: op.add,
    ast.Sub: op.sub,
    ast.Mult: op.mul,
    ast.Div: op.truediv,
    ast.Pow: op.pow,
    ast.USub: op.neg,
    ast.Mod: op.mod,
}


def safe_eval(node: Any) -> Any:
    if isinstance(node, ast.Num):  # Python < 3.8
        return node.n
    elif isinstance(node, ast.Constant):  # Python 3.8+
        return node.value
    elif isinstance(node, ast.BinOp):
        left = safe_eval(node.left)
        right = safe_eval(node.right)
        op_type = type(node.op)
        if op_type in OPERATORS:
            return OPERATORS[op_type](left, right)
        raise ValueError(f"Unsupported operator: {op_type}")
    elif isinstance(node, ast.UnaryOp):
        operand = safe_eval(node.operand)
        op_type = type(node.op)
        if op_type in OPERATORS:
            return OPERATORS[op_type](operand)
        raise ValueError(f"Unsupported operator: {op_type}")
    else:
        raise TypeError(f"Unsupported syntax tree element: {type(node)}")


class CalculatorTool(BaseTool):
    @property
    def name(self) -> str:
        return "calculator"

    @property
    def description(self) -> str:
        return "Safely evaluates mathematical expressions (e.g. '25 * 4 + 10 / 2', '2 ** 8', '1400 * 1.15')."

    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "The mathematical expression to evaluate.",
                }
            },
            "required": ["expression"],
        }

    async def execute(self, expression: str = "", **kwargs: Any) -> Dict[str, Any]:
        try:
            cleaned = expression.strip()
            parsed = ast.parse(cleaned, mode="eval").body
            result = safe_eval(parsed)
            return {"success": True, "expression": expression, "result": result}
        except Exception as e:
            return {"success": False, "expression": expression, "error": str(e)}
