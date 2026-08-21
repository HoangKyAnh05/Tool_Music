# Script Tạo Shortcut Ngoài Desktop Cho AI Music Studio
$ws = New-Object -ComObject WScript.Shell
$desktop = [System.Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop "AI Music & Vocal Studio.lnk"
$currentDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$shortcut = $ws.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $currentDir "run_app.bat"
$shortcut.WorkingDirectory = $currentDir
$shortcut.Description = "AI Music & Vocal Studio - 100% Free AI Music Studio"
$iconPath = Join-Path $currentDir "electron_app\src\assets\icon.ico"
if (Test-Path $iconPath) {
    $shortcut.IconLocation = "$iconPath,0"
}
$shortcut.Save()

Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "  ✅ ĐÃ TẠO PHÍM TẮT 'AI Music & Vocal Studio' THÀNH CÔNG NGOÀI DESKTOP!" -ForegroundColor Green
Write-Host "  📍 Đường dẫn: $shortcutPath" -ForegroundColor Yellow
Write-Host "=======================================================================" -ForegroundColor Cyan
