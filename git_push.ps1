# Script Đẩy Mã Nguồn Lên GitHub - AI Music Studio
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "              🚀 ĐẨY MÃ NGUỒN LÊN GITHUB REPOSITORY 🚀" -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "Remote: https://github.com/HoangKyAnh05/Tool_Music.git`n" -ForegroundColor Yellow

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[LỖI] Máy tính chưa cài đặt Git! Vui lòng cài Git từ https://git-scm.com/" -ForegroundColor Red
    Read-Host "Nhấn Enter để thoát..."
    exit 1
}

if (-not (Test-Path ".git")) {
    Write-Host "[1/4] Khởi tạo Git Repository..." -ForegroundColor Gray
    git init
    git branch -M main
} else {
    Write-Host "[1/4] Git Repository đã sẵn sàng." -ForegroundColor Gray
}

Write-Host "[2/4] Cấu hình Remote URL GitHub..." -ForegroundColor Gray
git remote remove origin 2>$null
git remote add origin https://github.com/HoangKyAnh05/Tool_Music.git

Write-Host "[3/4] Gom các tập tin (git add .)..." -ForegroundColor Gray
git add .

$defaultMsg = "Update AI Music Studio"
$inputMsg = Read-Host "Nhập nội dung commit (Nhấn Enter để dùng mặc định: '$defaultMsg')"
if ([string]::IsNullOrWhiteSpace($inputMsg)) {
    $commitMsg = $defaultMsg
} else {
    $commitMsg = $inputMsg
}

git commit -m "$commitMsg"

Write-Host "`n[4/4] Đang đẩy code lên GitHub nhánh main..." -ForegroundColor Cyan
git branch -M main
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=======================================================================" -ForegroundColor Green
    Write-Host "  ✅ ĐÃ ĐẨY MÃ NGUỒN LÊN GITHUB THÀNH CÔNG!" -ForegroundColor Green
    Write-Host "  🔗 Link Repo: https://github.com/HoangKyAnh05/Tool_Music.git" -ForegroundColor Yellow
    Write-Host "=======================================================================`n" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Có lỗi khi đẩy code lên GitHub." -ForegroundColor Red
    Write-Host "Vui lòng kiểm tra quyền tài khoản GitHub hoặc kết nối mạng.`n" -ForegroundColor Yellow
}

Read-Host "Nhấn Enter để kết thúc..."
