@echo off
chcp 65001 >nul
title Tạo Shortcut Desktop - AI Music Studio

echo =======================================================================
echo        🚀 TẠO PHÍM TẮT (SHORTCUT) RA MÀN HÌNH CHÍNH (DESKTOP)
echo =======================================================================
echo.

set "ROOT_DIR=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT_DIR%create_desktop_shortcut.ps1"

echo.
echo Bạn có thể ra màn hình Desktop và nhấp đúp vào icon để mở ứng dụng bất kỳ lúc nào.
echo.
pause
