' SIGP - Lanzador Invisible
' Inicia backend (3006) y frontend (5174) de SIGP sin mostrar ventanas de consola
Dim shell, fso, projectDir
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

projectDir = fso.GetParentFolderName(WScript.ScriptFullName) & "\.."

' Ejecutar backend en segundo plano sin ventana
shell.Run "cmd /c cd /d """ & projectDir & "\backend"" && npm start", 0, False

' Ejecutar frontend en segundo plano sin ventana
shell.Run "cmd /c cd /d """ & projectDir & "\frontend"" && npm run dev", 0, False
