import logging

import httpx
from fastapi import APIRouter, HTTPException

from core.config import settings
from models.schemas import ChatRequest

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/chat")
async def chat(req: ChatRequest) -> dict:
    payload = {
        "model": "local",
        "messages": [m.model_dump() for m in req.messages],
        "max_tokens": req.max_tokens,
        "temperature": req.temperature,
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(
                f"{settings.llama_url}/v1/chat/completions",
                json=payload,
            )
            r.raise_for_status()
            return r.json()

    except httpx.TimeoutException:
        logger.error("llama-server time-out.")
        raise HTTPException(status_code=504, detail="Model doesn't respond (timeout).")

    except httpx.ConnectError:
        logger.error("unable to connect to the llama-server.")
        raise HTTPException(status_code=503, detail="llama-server is not working.")

    except httpx.HTTPStatusError as e:
        logger.error("llama-server HTTP error: %s", e)
        raise HTTPException(
            status_code=502,
            detail=f"llama-server error returned: {e.response.status_code}",
        )

    except Exception as e:
        logger.exception("unexpected error: %s", e)
        raise HTTPException(status_code=500, detail="server error.")
