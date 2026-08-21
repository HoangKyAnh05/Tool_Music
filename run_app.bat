@echo off
chcp 65001 >nul
title AI Music & Vocal Studio - Launcher

echo =======================================================================
echo          🎵 AI MUSIC ^& VOCAL STUDIO (100%% FREE ^& LOCAL) 🎵
echo =======================================================================
echo.

set "ROOT_DIR=%~dp0"
set "VENV_DIR=%ROOT_DIR%python_backend\.venv"
set "PYTHON_EXE=%VENV_DIR%\Scripts\python.exe"

:: 1. Kiểm tra / Khởi tạo Virtual Environment cho Python Backend
if not exist "%PYTHON_EXE%" (
    echo [1/3] Đang khởi tạo môi trường Python (Python 3.11/3.14)...
    where uv >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        uv venv "%VENV_DIR%" --python 3.11
        if not exist "%PYTHON_EXE%" (
            uv venv "%VENV_DIR%"
        )
        echo [1/3] Đang cài đặt thư viện Python (FastAPI, Librosa, Edge-TTS, Pydub)...
        uv pip install -r "%ROOT_DIR%python_backend\requirements.txt" --python "%PYTHON_EXE%"
    ) else (
        where py >nul 2>nul
        if %ERRORLEVEL% EQU 0 (
            py -3.11 -m venv "%VENV_DIR%" 2>nul || py -m venv "%VENV_DIR%"
        ) else (
            python -m venv "%VENV_DIR%"
        )
        echo [1/3] Đang cài đặt thư viện Python...
        "%PYTHON_EXE%" -m pip install --upgrade pip
        "%PYTHON_EXE%" -m pip install -r "%ROOT_DIR%python_backend\requirements.txt"
    )
) else (
    echo [1/3] Môi trường Python Backend: ĐÃ SẴN SÀNG!
)

:: 2. Kiểm tra dependencies cho Electron Desktop
echo [2/3] Kiểm tra giao diện Electron Desktop...
if not exist "%ROOT_DIR%electron_app\node_modules" (
    echo Đang cài đặt thư viện Electron.js...
    cd /d "%ROOT_DIR%electron_app"
    call npm install
    cd /d "%ROOT_DIR%"
) else (
    echo [2/3] Giao diện Electron: ĐÃ SẴN SÀNG!
)

:: 3. Khởi chạy Backend và Electron
echo.
echo [3/3] Đang khởi động hệ thống AI Music Studio...
echo - Python Server: http://127.0.0.1:8888
echo - Giao diện Studio: Đang mở cửa sổ...
echo.

:: Khởi chạy backend ngầm
start "AI Music Studio Backend" /min "%PYTHON_EXE%" "%ROOT_DIR%python_backend\main.py"

:: Khởi chạy Electron App
cd /d "%ROOT_DIR%electron_app"
call npm start

exit /b 0
