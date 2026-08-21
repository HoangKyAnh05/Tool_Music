Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

strScriptPath = WScript.ScriptFullName
strFolder = FSO.GetParentFolderName(strScriptPath)

' Set working directory to project root
WshShell.CurrentDirectory = strFolder

' Run run_app.bat in hidden window mode (0 = hidden, False = don't wait)
WshShell.Run "cmd.exe /c """ & strFolder & "\run_app.bat""", 0, False
