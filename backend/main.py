import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from api import chat, health
from core.config import settings
from services.llama_manager import LlamaServerError, llama_manager

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        llama_manager.start()
        await llama_manager.wait_until_ready()
        logger.info("llama-server is ready → http://%s:%s", settings.app_host, settings.app_port)
    except LlamaServerError as e:
        logger.critical("llama-server could not be started : %s", e)
        logger.critical("The application starts without llama-server (the health check will fail).")

    yield

    llama_manager.stop()


# ── Application ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Arc Chat",
    description="Intel Arc GPU + llama.cpp SYCL based LLM inference API",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ─────────────────────────────────────────────────────────────────
app.include_router(health.router, prefix="/api", tags=["system"])
app.include_router(chat.router,   prefix="/api", tags=["inference"])

# ── Static files ─────────────────────────────────────────────────────────────
if settings.frontend_dir.exists():
    app.mount(
        "/static",
        StaticFiles(directory=str(settings.frontend_dir)),
        name="static",
    )
    logger.info("Frontend: %s", settings.frontend_dir)
else:
    logger.warning("Frontend directory not found: %s", settings.frontend_dir)


@app.get("/", include_in_schema=False)
async def root() -> FileResponse:
    index = settings.frontend_dir / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return FileResponse  # fallback
