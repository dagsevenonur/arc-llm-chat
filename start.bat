@echo off
setlocal

echo [arc-ai-chat] Desktop uygulamasi baslatiliyor...

if not exist "backend\.venv\Scripts\uvicorn.exe" (
    echo [arc-ai-chat] Backend sanal ortami bulunamadi.
    echo [arc-ai-chat] Once backend gereksinimlerini kurun.
    pause
    exit /b 1
)

if not exist "node_modules\electron" (
    echo [arc-ai-chat] Electron bagimliliklari eksik.
    echo [arc-ai-chat] Once proje kokunde npm install calistirin.
    pause
    exit /b 1
)

npm.cmd run dev
