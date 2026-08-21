# Tu dong day code len GitHub 1-Click
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

Write-Host '=======================================================================' -ForegroundColor Cyan
Write-Host '             DANG TU DONG DAY MA NGUON LEN GITHUB (1-CLICK)' -ForegroundColor Green
Write-Host '=======================================================================' -ForegroundColor Cyan
Write-Host 'Repo: https://github.com/HoangKyAnh05/Tool_Music.git' -ForegroundColor Yellow
Write-Host ''

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host '[LOI] May tinh chua cai dat Git!' -ForegroundColor Red
    Read-Host 'Nhan Enter de thoat...'
    exit 1
}

if (-not (Test-Path '.git')) {
    Write-Host '[1/4] Khoi tao Git Repository...' -ForegroundColor Gray
    git init
    git branch -M main
}

Write-Host '[2/4] Cap nhat Remote URL...' -ForegroundColor Gray
git remote remove origin 2>$null
git remote add origin https://github.com/HoangKyAnh05/Tool_Music.git

Write-Host '[3/4] Gom toan bo file thay doi (git add -A)...' -ForegroundColor Gray
git add -A

$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
git commit -m "Auto update AI Music Studio: $timestamp"

Write-Host '[4/4] Dang day truc tiep len GitHub...' -ForegroundColor Cyan
git branch -M main
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ''
    Write-Host '=======================================================================' -ForegroundColor Green
    Write-Host '  DA DAY CODE LEN GITHUB THANH CONG (100% TU DONG)!' -ForegroundColor Green
    Write-Host '  Link Repo: https://github.com/HoangKyAnh05/Tool_Music' -ForegroundColor Yellow
    Write-Host '=======================================================================' -ForegroundColor Green
} else {
    Write-Host ''
    Write-Host 'Co loi khi day code len GitHub. Vui long kiem tra lai ket noi mang hoac tai khoan.' -ForegroundColor Red
}

Write-Host ''
Read-Host 'Nhan Enter de dong cua so nay...'
