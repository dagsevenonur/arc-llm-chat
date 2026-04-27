from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # llama.cpp
    llama_server_exe: Path = Path(r"..\llama-sycl-b8931\llama-server.exe")
    llama_port: int = 8080
    llama_host: str = "127.0.0.1"
    llama_startup_timeout: int = 60

    # Model
    models_dir: Path = Path(r"..\llama-sycl-b8931\models")
    default_model: str = "Llama-3.2-3B-Instruct-Q4_K_M.gguf"

    # GPU
    gpu_layers: int = 99
    context_size: int = 2048
    oneapi_device: str = "level_zero:0"

    # Inference defaults
    default_max_tokens: int = 512
    default_temperature: float = 0.7

    # Server
    app_host: str = "0.0.0.0"
    app_port: int = 7860
    frontend_dir: Path = Path(__file__).parent.parent.parent / "frontend"

    @property
    def llama_url(self) -> str:
        return f"http://{self.llama_host}:{self.llama_port}"

    @property
    def active_model_path(self) -> Path:
        return self.models_dir / self.default_model

    def validate_paths(self) -> list[str]:
        issues = []
        if not self.llama_server_exe.exists():
            issues.append(f"llama-server not found: {self.llama_server_exe}")
        if not self.models_dir.exists():
            issues.append(f"Model directory not found: {self.models_dir}")
        if not self.active_model_path.exists():
            issues.append(f"Default model not found: {self.active_model_path}")
        return issues

settings = Settings()
