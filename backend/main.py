import subprocess
import sys
import os
import signal
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

LLAMA_SERVER_EXE = r"..\llama-sycl-b8931\llama-server.exe"
MODEL_PATH       = r"..\llama-sycl-b8931\models\Qwen3.5-9B-Q4_K_M.gguf"
LLAMA_PORT       = 8080
LLAMA_URL        = f"http://127.0.0.1:{LLAMA_PORT}"
CONTEXT_SIZE     = 2048
GPU_LAYERS       = 99

llama_process: subprocess.Popen | None = None

def start_llama_server():
    global llama_process
    env = os.environ.copy()
    env["ONEAPI_DEVICE_SELECTOR"]  = "level_zero:0"
    env["SYCL_CACHE_PERSISTENT"]   = "1"

    cmd = [
        LLAMA_SERVER_EXE,
        "-m", MODEL_PATH,
        "-ngl", str(GPU_LAYERS),
        "-c",   str(CONTEXT_SIZE),
        "--port", str(LLAMA_PORT),
        "--host", "127.0.0.1",
    ]
    print(f"[arc-llm] llama-server başlatılıyor: {' '.join(cmd)}")
    llama_process = subprocess.Popen(
        cmd, env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    print(f"[arc-llm] llama-server PID: {llama_process.pid}")

async def wait_for_server(timeout: int = 60):
    async with httpx.AsyncClient() as client:
        for _ in range(timeout):
            try:
                r = await client.get(f"{LLAMA_URL}/health")
                if r.status_code == 200:
                    print("[arc-llm] llama-server hazır ✓")
                    return
            except Exception:
                pass
            await asyncio.sleep(1)
    raise RuntimeError("llama-server başlatılamadı (timeout)")

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_llama_server()
    await wait_for_server()
    yield
    if llama_process:
        llama_process.terminate()
        print("[arc-llm] llama-server kapatıldı.")


app = FastAPI(title="arc-llm-chat", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

class Message(BaseModel):
    role: str       # "user" | "assistant" | "system"
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]
    max_tokens: int = 512
    temperature: float = 0.7
    stream: bool = False

@app.get("/")
async def root():
    index = FRONTEND_DIR / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return {"status": "arc-llm-chat çalışıyor", "ui": "/static/index.html"}

@app.get("/api/health")
async def health():
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{LLAMA_URL}/health", timeout=3)
            llama_ok = r.status_code == 200
    except Exception:
        llama_ok = False

    return {
        "backend": "ok",
        "llama_server": "ok" if llama_ok else "hata",
        "model": Path(MODEL_PATH).name,
        "gpu": "Intel Arc B580 (SYCL)",
    }

@app.post("/api/chat")
async def chat(req: ChatRequest):
    payload = {
        "model": "local",
        "messages": [m.model_dump() for m in req.messages],
        "max_tokens": req.max_tokens,
        "temperature": req.temperature,
        "stream": False,
    }
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.post(f"{LLAMA_URL}/v1/chat/completions", json=payload)
            r.raise_for_status()
            return r.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"llama-server hatası: {e}")

@app.get("/api/models")
async def list_models():
    model_dir = Path(MODEL_PATH).parent
    models = [f.name for f in model_dir.glob("*.gguf")]
    return {"models": models, "active": Path(MODEL_PATH).name}
