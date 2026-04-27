import asyncio
import os
import subprocess
import logging
from pathlib import Path

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


class LlamaServerError(Exception):
    """llama-server errors."""


class LlamaServerManager:
    def __init__(self) -> None:
        self._process: subprocess.Popen | None = None

    # ── Start ────────────────────────────────────────────────────────────────

    def start(self, model_path: Path | None = None) -> None:
        if self._process and self._process.poll() is None:
            logger.info("llama-server already running (PID %s)", self._process.pid)
            return

        model = model_path or settings.active_model_path
        self._validate(model)

        env = self._build_env()
        cmd = self._build_cmd(model)

        logger.info("llama-server is starting: %s", " ".join(str(c) for c in cmd))

        self._process = subprocess.Popen(
            cmd,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
        logger.info("llama-server started (PID %s)", self._process.pid)

    async def wait_until_ready(self) -> None:
        timeout = settings.llama_startup_timeout
        async with httpx.AsyncClient() as client:
            for attempt in range(timeout):
                # if llama-server process unexpectedly exited, read output and raise error
                if self._process and self._process.poll() is not None:
                    output = self._read_output()
                    raise LlamaServerError(
                        f"llama-server unexpectedly exited "
                        f"(exit={self._process.returncode}).\n{output}"
                    )

                try:
                    r = await client.get(
                        f"{settings.llama_url}/health", timeout=2.0
                    )
                    if r.status_code == 200:
                        logger.info("llama-server ready (%s. attempt)", attempt + 1)
                        return
                except httpx.ConnectError:
                    pass  # not ready yet, wait

                await asyncio.sleep(1)

        raise LlamaServerError(
            f"llama-server {timeout} seconds did not respond."
        )

    # ── Stop ─────────────────────────────────────────────────────────────────

    def stop(self) -> None:
        if not self._process:
            return
        if self._process.poll() is not None:
            logger.info("llama-server already closed.")
            return

        logger.info("llama-server is shutting down (PID %s)...", self._process.pid)
        self._process.terminate()
        try:
            self._process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            logger.warning("llama-server did not exit in time, killing...")
            self._process.kill()
        finally:
            self._process = None
            logger.info("llama-server shut down.")
    # ── Status ─────────────────────────────────────────────────────────────────

    @property
    def is_running(self) -> bool:
        return self._process is not None and self._process.poll() is None

    # ── Helpers ───────────────────────────────────────────────────────────

    @staticmethod
    def _validate(model_path: Path) -> None:
        issues = settings.validate_paths()
        if model_path != settings.active_model_path and not model_path.exists():
            issues.append(f"Model file not found: {model_path}")
        if issues:
            raise LlamaServerError("Configuration errors:\n" + "\n".join(issues))

    @staticmethod
    def _build_env() -> dict[str, str]:
        env = os.environ.copy()
        env["ONEAPI_DEVICE_SELECTOR"] = settings.oneapi_device
        env["SYCL_CACHE_PERSISTENT"]  = "1"
        return env

    @staticmethod
    def _build_cmd(model_path: Path) -> list[str]:
        return [
            str(settings.llama_server_exe),
            "-m",      str(model_path),
            "-ngl",    str(settings.gpu_layers),
            "-c",      str(settings.context_size),
            "--port",  str(settings.llama_port),
            "--host",  settings.llama_host,
        ]

    def _read_output(self) -> str:
        """Reads the accumulated output from the process stdout (for debugging)."""
        if not self._process or not self._process.stdout:
            return ""
        try:
            return self._process.stdout.read(4096)
        except Exception:
            return ""

llama_manager = LlamaServerManager()
