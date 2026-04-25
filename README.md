# arc-llm-chat

Intel Arc B580 + llama.cpp SYCL üzerinde çalışan yerel LLM chat uygulaması.

## Kurulum

```cmd
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Başlatma

Proje kök klasöründen:
```cmd
start.bat
```

Ardından tarayıcıdan: http://localhost:7860

## Ayarlar (backend/main.py)

| Değişken | Açıklama |
|---|---|
| `LLAMA_SERVER_EXE` | llama-server.exe yolu |
| `MODEL_PATH` | GGUF model dosyası yolu |
| `CONTEXT_SIZE` | Context uzunluğu (VRAM'i etkiler) |
| `GPU_LAYERS` | GPU'ya yüklenecek katman sayısı (99 = hepsi) |

## Gereksinimler

- Intel Arc B580 (veya diğer Arc GPU'lar)
- Intel oneAPI Base Toolkit
- llama.cpp SYCL Windows binary (b5377+)
- Python 3.11+
