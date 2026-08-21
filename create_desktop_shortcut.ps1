$ws = New-Object -ComObject WScript.Shell
$desktop = [System.Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop "AI Music & Vocal Studio.lnk"
$currentDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$shortcut = $ws.CreateShortcut($shortcutPath)
$vbsPath = Join-Path $currentDir "run_app_silent.vbs"

$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsPath`""
$shortcut.WorkingDirectory = $currentDir
$shortcut.Description = "AI Music & Vocal Studio (Silent Mode)"

$iconPath = Join-Path $currentDir "electron_app\src\assets\icon.ico"
if (Test-Path $iconPath) {
    $shortcut.IconLocation = "$iconPath,0"
}
$shortcut.Save()

Write-Host "Created silent shortcut at: $shortcutPath"
