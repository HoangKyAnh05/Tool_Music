@echo off
chcp 65001 >nul
title Đẩy Code Lên GitHub - AI Music Studio

echo =======================================================================
echo              🚀 ĐẨY MÃ NGUỒN LÊN GITHUB REPOSITORY 🚀
echo =======================================================================
echo Remote: https://github.com/HoangKyAnh05/Tool_Music.git
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

:: Kiểm tra git đã được cài đặt chưa
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [LỖI] Máy tính chưa cài đặt Git! Vui lòng cài Git từ https://git-scm.com/
    pause
    exit /b 1
)

:: Khởi tạo repo git nếu chưa có
if not exist ".git" (
    echo [1/5] Khởi tạo Git Repository cục bộ...
    git init
    git branch -M main
) else (
    echo [1/5] Git Repository cục bộ đã tồn tại.
)

:: Cấu hình remote origin
echo [2/5] Cấu hình Remote URL GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/HoangKyAnh05/Tool_Music.git

:: Thêm tất cả file vào staging
echo [3/5] Thêm các tập tin (git add)...
git add .

:: Tạo commit
echo [4/5] Tạo commit mã nguồn...
set /p COMMIT_MSG="Nhập nội dung ghi chú commit (Nhấn Enter để dùng mặc định): "
if "%COMMIT_MSG%"=="" (
    set "COMMIT_MSG=Initial commit: AI Music & Vocal Studio (Electron + Python FastAPI + Librosa + Gemini + Edge-TTS + Mixer)"
)

git commit -m "%COMMIT_MSG%"

:: Đẩy code lên GitHub
echo [5/5] Đang đẩy code lên nhánh main...
git branch -M main
git push -u origin main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =======================================================================
    echo ✅ ĐÃ ĐẨY MÃ NGUỒN LÊN GITHUB THÀNH CÔNG!
    echo 🔗 Link Repo: https://github.com/HoangKyAnh05/Tool_Music.git
    echo =======================================================================
) else (
    echo.
    echo ⚠️ Có lỗi khi đẩy code lên GitHub.
    echo Vui lòng kiểm tra quyền đăng nhập GitHub (Personal Access Token hoặc SSH Key).
)

echo.
pause
