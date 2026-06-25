' SIGP - Lanzador Invisible
' Inicia el backend de SIGP sin mostrar ventana de consola
Dim shell, fso, scriptPath, logPath
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptPath = fso.GetParentFolderName(WScript.ScriptFullName) & "\..\backend\src\index.js"
logPath = fso.GetParentFolderName(WScript.ScriptFullName) & "\..\backend\sigp.log"

' Ejecutar node en segundo plano sin ventana
shell.Run "node.exe """ & scriptPath & """", 0, False
