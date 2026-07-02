' SIGP - Lanzador Invisible
' Inicia backend (3006) y frontend (5174) de SIGP sin mostrar ventanas
Dim shell, fso, projectDir
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

projectDir = fso.GetParentFolderName(WScript.ScriptFullName) & "\.."

' Iniciar SIGP backend (port 3006)
shell.Run "cmd /c cd /d """ & projectDir & "\backend"" && npm start", 0, False

' Iniciar SIGP frontend (port 5174)
shell.Run "cmd /c cd /d """ & projectDir & "\frontend"" && npm run dev", 0, False
