# arc-llm-chat

Intel Arc B580 + llama.cpp SYCL uzerinde calisan yerel LLM chat uygulamasi. Proje artik gecici tarayici arayuzu yerine Electron tabanli bir masaustu kabugu kullanir ve Stitch'teki `Arc AI Chat Interface` tasarim dilini izler.

## Kurulum

### 1. Backend

```cmd
cd backend
py -3 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 2. Desktop shell

```cmd
npm install
```

## Baslatma

Proje kok klasorunden:

```cmd
start.bat
```

Bu akista Electron masaustu penceresi acilir. Uygulama gerekiyorsa mevcut FastAPI backend'i ve llama.cpp sunucusunu arka planda baslatir.

## Masaustu arayuz ozellikleri

- Stitch'teki koyu workspace tasarimina uygun sohbet alani
- Yerel oturum listesi ve hizli prompt'lar
- Backend, model ve GPU durum paneli
- Temperature ve max token ayarlari
- Backend'i uygulama icinden yeniden baslatma

## Ayarlar (`backend/main.py`)

| Degisken | Aciklama |
|---|---|
| `LLAMA_SERVER_EXE` | `llama-server.exe` yolu |
| `MODEL_PATH` | GGUF model dosyasi yolu |
| `CONTEXT_SIZE` | Context uzunlugu, VRAM kullanimini etkiler |
| `GPU_LAYERS` | GPU'ya yuklenecek katman sayisi (`99` = hepsi) |

## Gereksinimler

- Intel Arc B580 veya benzeri Arc GPU
- Intel oneAPI Base Toolkit
- llama.cpp SYCL Windows binary
- Python 3.11+
- Node.js
