@echo off
chcp 65001 >nul
title Đẩy Code Lên GitHub - AI Music Studio

echo =======================================================================
echo              🚀 ĐẨY MÃ NGUỒN LÊN GITHUB REPOSITORY 🚀
echo =======================================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

:: 1. Kiểm tra Git
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [LỖI] Máy tính chưa cài đặt Git! Vui lòng cài Git từ https://git-scm.com/
    echo.
    pause
    exit /b 1
)

:: 2. Khởi tạo Git nếu chưa có
if not exist ".git" (
    echo [1/4] Khởi tạo Git Repository...
    git init
    git branch -M main
) else (
    echo [1/4] Git Repository đã sẵn sàng.
)

:: 3. Cấu hình Remote
echo [2/4] Cấu hình Remote URL GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/HoangKyAnh05/Tool_Music.git

:: 4. Thêm file và Commit
echo [3/4] Đang gom các tập tin thay đổi (git add)...
git add .

echo.
set /p "USER_MSG=Nhập nội dung commit (Nhấn Enter để dùng mặc định): "

if "%USER_MSG%"=="" (
    set "USER_MSG=Update AI Music Studio"
)

git commit -m "%USER_MSG%"

:: 5. Đẩy code lên GitHub
echo.
echo [4/4] Đang đẩy code lên GitHub nhánh main...
git branch -M main
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =======================================================================
    echo   ✅ ĐÃ ĐẨY MÃ NGUỒN LÊN GITHUB THÀNH CÔNG!
    echo   🔗 Link Repo: https://github.com/HoangKyAnh05/Tool_Music.git
    echo =======================================================================
) else (
    echo.
    echo ⚠️ Có lỗi khi đẩy code lên GitHub.
    echo Vui lòng kiểm tra quyền tài khoản GitHub hoặc kết nối mạng.
)

echo.
echo =======================================================================
pause
