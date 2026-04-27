import logging

import httpx
from fastapi import APIRouter

from core.config import settings
from models.schemas import HealthResponse, ModelsResponse
from services.llama_manager import llama_manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    llama_ok = False
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{settings.llama_url}/health", timeout=3.0)
            llama_ok = r.status_code == 200
    except httpx.HTTPError:
        pass

    return HealthResponse(
        backend="ok",
        llama_server="ok" if llama_ok else "error",
        model=settings.default_model,
        gpu="Intel Arc B580 (SYCL)",
    )


@router.get("/models", response_model=ModelsResponse)
async def list_models() -> ModelsResponse:
    models_dir = settings.models_dir
    models = sorted(f.name for f in models_dir.glob("*.gguf")) if models_dir.exists() else []

    return ModelsResponse(
        models=models,
        active=settings.default_model,
    )
