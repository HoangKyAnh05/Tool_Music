# Script Đẩy Mã Nguồn Lên GitHub - AI Music Studio
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "Đẩy Code Lên GitHub - AI Music Studio"

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "              🚀 ĐẨY MÃ NGUỒN LÊN GITHUB REPOSITORY 🚀" -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "Remote: https://github.com/HoangKyAnh05/Tool_Music.git`n" -ForegroundColor Yellow

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

# 1. Kiểm tra Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[LỖI] Máy tính chưa cài đặt Git! Vui lòng cài Git từ https://git-scm.com/" -ForegroundColor Red
    pause
    exit 1
}

# 2. Khởi tạo Git nếu chưa có
if (-not (Test-Path ".git")) {
    Write-Host "[1/5] Khởi tạo Git Repository cục bộ..." -ForegroundColor Gray
    git init
    git branch -M main
} else {
    Write-Host "[1/5] Git Repository cục bộ đã sẵn sàng." -ForegroundColor Gray
}

# 3. Cấu hình Remote Origin
Write-Host "[2/5] Cấu hình Remote URL GitHub..." -ForegroundColor Gray
git remote remove origin 2>$null
git remote add origin https://github.com/HoangKyAnh05/Tool_Music.git

# 4. Thêm file vào Staging
Write-Host "[3/5] Thêm các tập tin (git add .)..." -ForegroundColor Gray
git add .

# 5. Commit
Write-Host "[4/5] Tạo commit mã nguồn..." -ForegroundColor Gray
$defaultMsg = "Update: AI Music & Vocal Studio - Studio Engine & UI Refresh Feature"
$inputMsg = Read-Host "Nhập nội dung commit (Nhấn Enter để dùng mặc định: '$defaultMsg')"
if ([string]::IsNullOrWhiteSpace($inputMsg)) {
    $commitMsg = $defaultMsg
} else {
    $commitMsg = $inputMsg
}

git commit -m $commitMsg

# 6. Push lên GitHub
Write-Host "[5/5] Đang đẩy code lên GitHub nhánh main..." -ForegroundColor Cyan
git branch -M main
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=======================================================================" -ForegroundColor Green
    Write-Host "  ✅ ĐÃ ĐẨY MÃ NGUỒN LÊN GITHUB THÀNH CÔNG!" -ForegroundColor Green
    Write-Host "  🔗 Link Repo: https://github.com/HoangKyAnh05/Tool_Music.git" -ForegroundColor Yellow
    Write-Host "=======================================================================`n" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ Có lỗi khi đẩy code lên GitHub." -ForegroundColor Red
    Write-Host "Vui lòng kiểm tra kết nối mạng và tài khoản GitHub của bạn.`n" -ForegroundColor Yellow
}

Write-Host "Nhấn phím bất kỳ để thoát..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
