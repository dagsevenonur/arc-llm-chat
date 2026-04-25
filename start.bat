@echo off
echo [arc-llm-chat] Ortam hazırlanıyor...

call "C:\Program Files (x86)\Intel\oneAPI\setvars.bat" > nul 2>&1

if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)

echo [arc-llm-chat] Sunucu başlatılıyor...
echo [arc-llm-chat] Tarayıcıdan: http://localhost:7860
echo.

cd backend
uvicorn main:app --host 0.0.0.0 --port 7860 --reload

pause
