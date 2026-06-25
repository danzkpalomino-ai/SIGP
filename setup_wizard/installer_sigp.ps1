Add-Type -AssemblyName System.Windows.Forms, System.Drawing

$Global:setupPath = $PSScriptRoot
$Global:rootPath = (Resolve-Path "$Global:setupPath\..").Path
$bannerPath = Join-Path $Global:setupPath "banner_ins.png"

# --- COLORES ---
$colorBg = [Drawing.Color]::White
$colorSidebar = [Drawing.Color]::FromArgb(28, 18, 8)
$colorOrange = [Drawing.Color]::FromArgb(210, 130, 20)
$colorText = [Drawing.Color]::Black
$colorMuted = [Drawing.Color]::FromArgb(100, 85, 60)
$colorSuccess = [Drawing.Color]::FromArgb(22, 163, 74)
$colorWarning = [Drawing.Color]::FromArgb(217, 119, 6)
$colorError = [Drawing.Color]::FromArgb(220, 38, 38)

# --- DETECCION DE ESTADO ---
$tieneBackend = Test-Path "$Global:rootPath\backend\node_modules"
$tieneFrontend = Test-Path "$Global:rootPath\frontend\node_modules"
$tieneEnv = Test-Path "$Global:rootPath\backend\.env"
$tieneAccesos = (Test-Path "$env:USERPROFILE\Desktop\SIGP - Sistema.lnk") -or (Test-Path "$env:USERPROFILE\Desktop\SIGP - DEBUG.lnk")

$sistemaDetectado = $tieneBackend -or $tieneFrontend
$todoCompleto = $tieneBackend -and $tieneFrontend -and $tieneEnv -and $tieneAccesos

# --- FORM ---
$form = New-Object Windows.Forms.Form
$form.Text = "SIGP - Instalador"
$form.ClientSize = New-Object Drawing.Size(860, 560)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.BackColor = $colorBg

# --- SIDEBAR ---
$sidebar = New-Object Windows.Forms.Panel
$sidebar.Size = New-Object Drawing.Size(280, 560)
$sidebar.Location = New-Object Drawing.Point(0, 0)
$sidebar.BackColor = $colorSidebar
$form.Controls.Add($sidebar)

$picBanner = New-Object Windows.Forms.PictureBox
$picBanner.Size = New-Object Drawing.Size(280, 560)
$picBanner.Location = New-Object Drawing.Point(0, 0)
$picBanner.SizeMode = "StretchImage"
$picBanner.BackColor = $colorSidebar
if (Test-Path $bannerPath) {
    try { $picBanner.Image = [Drawing.Image]::FromFile($bannerPath) } catch {}
}
$sidebar.Controls.Add($picBanner)

# --- PANEL CONTENIDO ---
$panel = New-Object Windows.Forms.Panel
$panel.Size = New-Object Drawing.Size(560, 560)
$panel.Location = New-Object Drawing.Point(280, 0)
$panel.BackColor = $colorBg
$form.Controls.Add($panel)

# ========================================================
# PAGINA 0: SISTEMA DETECTADO
# ========================================================
$page0 = New-Object Windows.Forms.Panel
$page0.Size = New-Object Drawing.Size(540, 500)
$page0.Location = New-Object Drawing.Point(10, 10)
$page0.Visible = $sistemaDetectado
$page0.BackColor = $colorBg
$panel.Controls.Add($page0)

$topBar0 = New-Object Windows.Forms.Panel
$topBar0.Size = New-Object Drawing.Size(540, 55)
$topBar0.Location = New-Object Drawing.Point(0, 0)
$topBar0.BackColor = $colorOrange
$page0.Controls.Add($topBar0)

$lblTitle0 = New-Object Windows.Forms.Label
$lblTitle0.Text = if ($todoCompleto) { "Sistema Actualizado" } else { "Sistema Detectado" }
$lblTitle0.Font = New-Object Drawing.Font("Segoe UI", 18, [Drawing.FontStyle]::Bold)
$lblTitle0.ForeColor = [Drawing.Color]::White
$lblTitle0.AutoSize = $true
$lblTitle0.Location = New-Object Drawing.Point(16, 12)
$topBar0.Controls.Add($lblTitle0)

$lblPath0 = New-Object Windows.Forms.Label
$lblPath0.Text = "Ubicacion actual: $Global:rootPath"
$lblPath0.Font = New-Object Drawing.Font("Segoe UI", 9)
$lblPath0.ForeColor = $colorMuted
$lblPath0.Size = New-Object Drawing.Size(520, 18)
$lblPath0.Location = New-Object Drawing.Point(0, 68)
$page0.Controls.Add($lblPath0)

$lblInfo0 = New-Object Windows.Forms.Label
$lblInfo0.Text = if ($todoCompleto) { "Todos los componentes estan instalados.`nEl sistema esta listo para usarse." } else { "Se ha detectado una instalacion existente de SIGP.`nSelecciona el modo de operacion:" }
$lblInfo0.Font = New-Object Drawing.Font("Segoe UI", 9)
$lblInfo0.ForeColor = $colorMuted
$lblInfo0.Size = New-Object Drawing.Size(520, 32)
$lblInfo0.Location = New-Object Drawing.Point(0, 88)
$page0.Controls.Add($lblInfo0)

# --- Panel de componentes ---
$cardComp = New-Object Windows.Forms.Panel
$cardComp.Size = New-Object Drawing.Size(530, 90)
$cardComp.Location = New-Object Drawing.Point(0, 125)
$cardComp.BackColor = [Drawing.Color]::FromArgb(250, 248, 240)
$cardComp.BorderStyle = "FixedSingle"
$page0.Controls.Add($cardComp)

function Add-StatusLine($parent, $y, $label, $ok) {
    $icon = if ($ok) { "[ OK ]" } else { "[ -- ]" }
    $color = if ($ok) { $colorSuccess } else { $colorMuted }
    $l = New-Object Windows.Forms.Label
    $l.Text = "$icon  $label"
    $l.Font = New-Object Drawing.Font("Consolas", 9)
    $l.ForeColor = $color
    $l.Size = New-Object Drawing.Size(510, 20)
    $l.Location = New-Object Drawing.Point(10, $y)
    $cardComp.Controls.Add($l)
}

Add-StatusLine $cardComp 8  "Backend Node.js .............. $(if($tieneBackend){'instalado'}else{'faltante'})" $tieneBackend
Add-StatusLine $cardComp 30 "Frontend React ............... $(if($tieneFrontend){'instalado'}else{'faltante'})" $tieneFrontend
Add-StatusLine $cardComp 52 "Archivo .env ................. $(if($tieneEnv){'configurado'}else{'faltante'})" $tieneEnv
Add-StatusLine $cardComp 74 "Accesos directos ............ $(if($tieneAccesos){'creados'}else{'faltantes'})" $tieneAccesos

# --- Radio buttons de modo ---
$lblModo = New-Object Windows.Forms.Label
$lblModo.Text = "Modo de operacion:"
$lblModo.Font = New-Object Drawing.Font("Segoe UI", 9, [Drawing.FontStyle]::Bold)
$lblModo.ForeColor = $colorText
$lblModo.AutoSize = $true
$lblModo.Location = New-Object Drawing.Point(0, 235)
$page0.Controls.Add($lblModo)

$radioGroup = New-Object Windows.Forms.Panel
$radioGroup.Size = New-Object Drawing.Size(530, 100)
$radioGroup.Location = New-Object Drawing.Point(0, 255)
$radioGroup.BackColor = $colorBg
$page0.Controls.Add($radioGroup)

$rbUpdate = New-Object Windows.Forms.RadioButton
$rbUpdate.Text = "Actualizacion completa  (npm update + rebuild)"
$rbUpdate.Checked = $true
$rbUpdate.Size = New-Object Drawing.Size(510, 22)
$rbUpdate.Location = New-Object Drawing.Point(10, 5)
$rbUpdate.ForeColor = $colorText
$rbUpdate.Font = New-Object Drawing.Font("Segoe UI", 9)
$radioGroup.Controls.Add($rbUpdate)

$lblUpdateDesc = New-Object Windows.Forms.Label
$lblUpdateDesc.Text = "Actualiza dependencias sin borrar nada. Rapido y seguro."
$lblUpdateDesc.Font = New-Object Drawing.Font("Segoe UI", 8)
$lblUpdateDesc.ForeColor = $colorMuted
$lblUpdateDesc.Size = New-Object Drawing.Size(500, 16)
$lblUpdateDesc.Location = New-Object Drawing.Point(28, 25)
$radioGroup.Controls.Add($lblUpdateDesc)

$rbClean = New-Object Windows.Forms.RadioButton
$rbClean.Text = "Reinstalar desde cero  (borra node_modules y reinstala)"
$rbClean.Size = New-Object Drawing.Size(510, 22)
$rbClean.Location = New-Object Drawing.Point(10, 50)
$rbClean.ForeColor = $colorText
$rbClean.Font = New-Object Drawing.Font("Segoe UI", 9)
$radioGroup.Controls.Add($rbClean)

$lblCleanDesc = New-Object Windows.Forms.Label
$lblCleanDesc.Text = "Limpia node_modules y reinstala todo. Recomendado si hay errores."
$lblCleanDesc.Font = New-Object Drawing.Font("Segoe UI", 8)
$lblCleanDesc.ForeColor = $colorMuted
$lblCleanDesc.Size = New-Object Drawing.Size(500, 16)
$lblCleanDesc.Location = New-Object Drawing.Point(28, 70)
$radioGroup.Controls.Add($lblCleanDesc)

$chkAccesos0 = New-Object Windows.Forms.CheckBox
$chkAccesos0.Text = " Recrear accesos directos en el escritorio"
$chkAccesos0.Checked = $true
$chkAccesos0.Location = New-Object Drawing.Point(0, 370)
$chkAccesos0.AutoSize = $true
$chkAccesos0.ForeColor = $colorText
$chkAccesos0.Font = New-Object Drawing.Font("Segoe UI", 9)
$chkAccesos0.BackColor = $colorBg
$page0.Controls.Add($chkAccesos0)

# Cuando todo esta completo, ocultar opciones
if ($todoCompleto) {
    $lblModo.Visible = $false
    $radioGroup.Visible = $false
    $chkAccesos0.Visible = $false
}

# ========================================================
# PAGINA 1: BIENVENIDA (instalacion nueva)
# ========================================================
$page1 = New-Object Windows.Forms.Panel
$page1.Size = New-Object Drawing.Size(540, 500)
$page1.Location = New-Object Drawing.Point(10, 10)
$page1.Visible = -not $sistemaDetectado
$page1.BackColor = $colorBg
$panel.Controls.Add($page1)

$topBar1 = New-Object Windows.Forms.Panel
$topBar1.Size = New-Object Drawing.Size(540, 55)
$topBar1.Location = New-Object Drawing.Point(0, 0)
$topBar1.BackColor = $colorOrange
$page1.Controls.Add($topBar1)

$lblTitle1 = New-Object Windows.Forms.Label
$lblTitle1.Text = "Bienvenido"
$lblTitle1.Font = New-Object Drawing.Font("Segoe UI", 18, [Drawing.FontStyle]::Bold)
$lblTitle1.ForeColor = [Drawing.Color]::White
$lblTitle1.AutoSize = $true
$lblTitle1.Location = New-Object Drawing.Point(16, 12)
$topBar1.Controls.Add($lblTitle1)

$lblSub1 = New-Object Windows.Forms.Label
$lblSub1.Text = "Instalador portable de SIGP - Sistema de Gestion de Puntos"
$lblSub1.Font = New-Object Drawing.Font("Segoe UI", 9)
$lblSub1.ForeColor = $colorMuted
$lblSub1.Size = New-Object Drawing.Size(520, 18)
$lblSub1.Location = New-Object Drawing.Point(0, 68)
$page1.Controls.Add($lblSub1)

$cardTerms = New-Object Windows.Forms.Panel
$cardTerms.Size = New-Object Drawing.Size(530, 310)
$cardTerms.Location = New-Object Drawing.Point(0, 95)
$cardTerms.BackColor = [Drawing.Color]::FromArgb(252, 250, 245)
$cardTerms.BorderStyle = "FixedSingle"
$page1.Controls.Add($cardTerms)

$txtTerms = New-Object Windows.Forms.TextBox
$txtTerms.Multiline = $true
$txtTerms.ReadOnly = $true
$txtTerms.ScrollBars = "Vertical"
$txtTerms.Size = New-Object Drawing.Size(510, 290)
$txtTerms.Location = New-Object Drawing.Point(10, 10)
$txtTerms.BackColor = [Drawing.Color]::FromArgb(252, 250, 245)
$txtTerms.ForeColor = [Drawing.Color]::FromArgb(40, 35, 25)
$txtTerms.Font = New-Object Drawing.Font("Consolas", 9)
$txtTerms.BorderStyle = "None"
$txtTerms.Text = "  SIGP v2 - LICENCIA DE USO`r`n" +
"  (c) 2026 Tech Dany Palomino`r`n`r`n" +
"  Al instalar usted acepta:`r`n`r`n" +
"  1. USO: Sistema de punto de venta en tiempo real.`r`n" +
"  2. PORTABILIDAD: Disenado para funcionar en cualquier`r`n" +
"     PC con Windows 10/11 sin configuracion manual.`r`n" +
"  3. DEPENDENCIAS: Node.js se descarga e instala`r`n" +
"     automaticamente desde el instalador de SICCE.`r`n" +
"  4. PRIVACIDAD: Datos procesados localmente.`r`n" +
"  5. CREDITOS: Tech Dany Palomino"
$cardTerms.Controls.Add($txtTerms)

$chkAccept = New-Object Windows.Forms.CheckBox
$chkAccept.Text = " Acepto los terminos y condiciones"
$chkAccept.Location = New-Object Drawing.Point(0, 420)
$chkAccept.AutoSize = $true
$chkAccept.ForeColor = $colorText
$chkAccept.Font = New-Object Drawing.Font("Segoe UI", 9)
$chkAccept.BackColor = $colorBg
$page1.Controls.Add($chkAccept)

# ========================================================
# PAGINA 2: CONFIGURACION
# ========================================================
$page2 = New-Object Windows.Forms.Panel
$page2.Size = New-Object Drawing.Size(540, 500)
$page2.Location = New-Object Drawing.Point(10, 10)
$page2.Visible = $false
$page2.BackColor = $colorBg
$panel.Controls.Add($page2)

$topBar2 = New-Object Windows.Forms.Panel
$topBar2.Size = New-Object Drawing.Size(540, 55)
$topBar2.Location = New-Object Drawing.Point(0, 0)
$topBar2.BackColor = $colorOrange
$page2.Controls.Add($topBar2)

$lblTitle2 = New-Object Windows.Forms.Label
$lblTitle2.Text = "Configuracion"
$lblTitle2.Font = New-Object Drawing.Font("Segoe UI", 18, [Drawing.FontStyle]::Bold)
$lblTitle2.ForeColor = [Drawing.Color]::White
$lblTitle2.AutoSize = $true
$lblTitle2.Location = New-Object Drawing.Point(16, 12)
$topBar2.Controls.Add($lblTitle2)

$lblPath = New-Object Windows.Forms.Label
$lblPath.Text = "Ruta de instalacion:"
$lblPath.Font = New-Object Drawing.Font("Segoe UI", 9)
$lblPath.ForeColor = $colorMuted
$lblPath.AutoSize = $true
$lblPath.Location = New-Object Drawing.Point(0, 72)
$page2.Controls.Add($lblPath)

$txtPath = New-Object Windows.Forms.TextBox
$txtPath.Text = $Global:rootPath
$txtPath.Size = New-Object Drawing.Size(440, 25)
$txtPath.Location = New-Object Drawing.Point(0, 92)
$txtPath.BackColor = [Drawing.Color]::White
$txtPath.ForeColor = [Drawing.Color]::Black
$txtPath.BorderStyle = "FixedSingle"
$page2.Controls.Add($txtPath)

$btnBrowse = New-Object Windows.Forms.Button
$btnBrowse.Text = "..."
$btnBrowse.Size = New-Object Drawing.Size(35, 25)
$btnBrowse.Location = New-Object Drawing.Point(448, 92)
$btnBrowse.BackColor = $colorOrange
$btnBrowse.ForeColor = [Drawing.Color]::White
$btnBrowse.FlatStyle = "Flat"
$btnBrowse.Add_Click({
    $fbd = New-Object Windows.Forms.FolderBrowserDialog
    $fbd.SelectedPath = $txtPath.Text
    if ($fbd.ShowDialog() -eq "OK") { $txtPath.Text = $fbd.SelectedPath }
})
$page2.Controls.Add($btnBrowse)

$lblAcc = New-Object Windows.Forms.Label
$lblAcc.Text = "Accesos directos:"
$lblAcc.Font = New-Object Drawing.Font("Segoe UI", 9, [Drawing.FontStyle]::Bold)
$lblAcc.ForeColor = $colorText
$lblAcc.AutoSize = $true
$lblAcc.Location = New-Object Drawing.Point(0, 145)
$page2.Controls.Add($lblAcc)

$chkSilent = New-Object Windows.Forms.CheckBox
$chkSilent.Text = " Acceso directo silencioso (inicio automatico)"
$chkSilent.Checked = $true
$chkSilent.Location = New-Object Drawing.Point(0, 170)
$chkSilent.AutoSize = $true
$chkSilent.ForeColor = $colorText
$chkSilent.Font = New-Object Drawing.Font("Segoe UI", 9)
$chkSilent.BackColor = $colorBg
$page2.Controls.Add($chkSilent)

$chkDebug = New-Object Windows.Forms.CheckBox
$chkDebug.Text = " Acceso directo debug (ventanas visibles)"
$chkDebug.Location = New-Object Drawing.Point(0, 200)
$chkDebug.AutoSize = $true
$chkDebug.ForeColor = $colorText
$chkDebug.Font = New-Object Drawing.Font("Segoe UI", 9)
$chkDebug.BackColor = $colorBg
$page2.Controls.Add($chkDebug)

# ========================================================
# PAGINA 3: PROGRESO
# ========================================================
$page3 = New-Object Windows.Forms.Panel
$page3.Size = New-Object Drawing.Size(540, 500)
$page3.Location = New-Object Drawing.Point(10, 10)
$page3.Visible = $false
$page3.BackColor = $colorBg
$panel.Controls.Add($page3)

$topBar3 = New-Object Windows.Forms.Panel
$topBar3.Size = New-Object Drawing.Size(540, 55)
$topBar3.Location = New-Object Drawing.Point(0, 0)
$topBar3.BackColor = $colorOrange
$page3.Controls.Add($topBar3)

$lblTitle3 = New-Object Windows.Forms.Label
$lblTitle3.Text = "Instalando..."
$lblTitle3.Font = New-Object Drawing.Font("Segoe UI", 18, [Drawing.FontStyle]::Bold)
$lblTitle3.ForeColor = [Drawing.Color]::White
$lblTitle3.AutoSize = $true
$lblTitle3.Location = New-Object Drawing.Point(16, 12)
$topBar3.Controls.Add($lblTitle3)

$progBar = New-Object Windows.Forms.ProgressBar
$progBar.Size = New-Object Drawing.Size(530, 10)
$progBar.Location = New-Object Drawing.Point(0, 72)
$progBar.ForeColor = $colorOrange
$progBar.BackColor = [Drawing.Color]::FromArgb(230, 220, 200)
$progBar.Style = "Continuous"
$page3.Controls.Add($progBar)

$cardLog = New-Object Windows.Forms.Panel
$cardLog.Size = New-Object Drawing.Size(530, 390)
$cardLog.Location = New-Object Drawing.Point(0, 95)
$cardLog.BackColor = [Drawing.Color]::FromArgb(12, 10, 8)
$cardLog.BorderStyle = "FixedSingle"
$page3.Controls.Add($cardLog)

$txtLogs = New-Object Windows.Forms.TextBox
$txtLogs.Multiline = $true
$txtLogs.ReadOnly = $true
$txtLogs.ScrollBars = "Vertical"
$txtLogs.Size = New-Object Drawing.Size(510, 370)
$txtLogs.Location = New-Object Drawing.Point(10, 10)
$txtLogs.BackColor = [Drawing.Color]::FromArgb(12, 10, 8)
$txtLogs.ForeColor = [Drawing.Color]::FromArgb(52, 211, 153)
$txtLogs.Font = New-Object Drawing.Font("Consolas", 9)
$txtLogs.BorderStyle = "None"
$cardLog.Controls.Add($txtLogs)

# ========================================================
# PAGINA 4: FINALIZACION
# ========================================================
$page4 = New-Object Windows.Forms.Panel
$page4.Size = New-Object Drawing.Size(540, 500)
$page4.Location = New-Object Drawing.Point(10, 10)
$page4.Visible = $false
$page4.BackColor = $colorBg
$panel.Controls.Add($page4)

$topBar4 = New-Object Windows.Forms.Panel
$topBar4.Size = New-Object Drawing.Size(540, 55)
$topBar4.Location = New-Object Drawing.Point(0, 0)
$topBar4.BackColor = $colorOrange
$page4.Controls.Add($topBar4)

$lblDone = New-Object Windows.Forms.Label
$lblDone.Text = "Instalacion Exitosa"
$lblDone.Font = New-Object Drawing.Font("Segoe UI", 18, [Drawing.FontStyle]::Bold)
$lblDone.ForeColor = [Drawing.Color]::White
$lblDone.AutoSize = $true
$lblDone.Location = New-Object Drawing.Point(16, 12)
$topBar4.Controls.Add($lblDone)

$lblDoneDesc = New-Object Windows.Forms.Label
$lblDoneDesc.Text = "SIGP esta listo para usarse."
$lblDoneDesc.Font = New-Object Drawing.Font("Segoe UI", 12)
$lblDoneDesc.ForeColor = $colorMuted
$lblDoneDesc.Size = New-Object Drawing.Size(500, 40)
$lblDoneDesc.Location = New-Object Drawing.Point(0, 90)
$page4.Controls.Add($lblDoneDesc)

# ========================================================
# BOTON SIGUIENTE / FINALIZAR
# ========================================================
$btnNext = New-Object Windows.Forms.Button
$btnNext.Text = if ($todoCompleto) { "Cerrar" } elseif ($sistemaDetectado) { "Iniciar" } else { "Siguiente" }
$btnNext.Size = New-Object Drawing.Size(150, 44)
$btnNext.Location = New-Object Drawing.Point(370, 505)
$btnNext.BackColor = $colorOrange
$btnNext.ForeColor = [Drawing.Color]::Black
$btnNext.FlatStyle = "Flat"
$btnNext.Font = New-Object Drawing.Font("Segoe UI", 11, [Drawing.FontStyle]::Bold)
$btnNext.Enabled = $sistemaDetectado -or (-not $sistemaDetectado -and $false)
$btnNext.FlatAppearance.BorderSize = 0
$panel.Controls.Add($btnNext)

# ========================================================
# VARIABLES GLOBALES
# ========================================================
$Global:modoSeleccionado = "update"
$Global:recrearAccesos = $true
$Global:destPath = $Global:rootPath

# ========================================================
# LOGICA DE NAVEGACION
# ========================================================
$chkAccept.Add_Click({ $btnNext.Enabled = $chkAccept.Checked })

$chkAccesos0.Add_Click({ $Global:recrearAccesos = $chkAccesos0.Checked })

$rbUpdate.Add_Click({ $Global:modoSeleccionado = "update" })
$rbClean.Add_Click({ $Global:modoSeleccionado = "clean" })

$timer = New-Object Windows.Forms.Timer
$timer.Interval = 400
$timer.Add_Tick({
    $job = Get-Job -Name "InstaladorJob" -ErrorAction SilentlyContinue
    if ($job) {
        $data = Receive-Job -Job $job
        foreach ($line in $data) {
            $logLine = "[$((Get-Date).ToString('HH:mm:ss'))] $line"
            $txtLogs.AppendText("$logLine`r`n")
            try {
                $logFile = Join-Path $Global:destPath "install.log"
                $logLine | Out-File -FilePath $logFile -Append -Encoding utf8
            } catch {}
            $txtLogs.SelectionStart = $txtLogs.TextLength
            $txtLogs.ScrollToCaret()
            if ($progBar.Value -lt 90) { $progBar.Value += 2 }
        }
        if ($job.State -ne "Running") {
            $progBar.Value = 100
            $timer.Stop()
            Remove-Job -Name "InstaladorJob"

            # Crear accesos directos
            if ($Global:recrearAccesos) {
                $txtLogs.AppendText("[$((Get-Date).ToString('HH:mm:ss'))] Creando accesos directos...`r`n")
                $desktop = [Environment]::GetFolderPath("Desktop")
                $vbsContent = @"
Set ws = CreateObject("WScript.Shell")
desktop = ws.SpecialFolders("Desktop")
wd = "$Global:destPath"

Set s1 = ws.CreateShortcut(desktop & "\SIGP - Sistema.lnk")
s1.TargetPath = "wscript.exe"
s1.Arguments = Chr(34) & wd & "\bin\util_lanzador_invisible_sigp.vbs" & Chr(34)
s1.WorkingDirectory = wd
s1.Save()

Set s2 = ws.CreateShortcut(desktop & "\SIGP - DEBUG.lnk")
s2.TargetPath = "cmd.exe"
s2.Arguments = "/c " & Chr(34) & wd & "\bin\ABRIR_SIGP_DEBUG.bat" & Chr(34)
s2.WorkingDirectory = wd
s2.Save()
"@
                $vbsFile = Join-Path $env:TEMP "crear_accesos_sigp.vbs"
                Set-Content -Path $vbsFile -Value $vbsContent -Encoding ASCII
                $vbsOut = & cscript.exe //Nologo $vbsFile 2>&1
                foreach ($vbsLine in $vbsOut) {
                    $txtLogs.AppendText("[$((Get-Date).ToString('HH:mm:ss'))] VBS: $vbsLine`r`n")
                }
                Remove-Item $vbsFile -Force
                $existeSistema = Test-Path (Join-Path $desktop "SIGP - Sistema.lnk")
                $existeDebug = Test-Path (Join-Path $desktop "SIGP - DEBUG.lnk")
                if ($existeSistema -or $existeDebug) {
                    $txtLogs.AppendText("[$((Get-Date).ToString('HH:mm:ss'))] Accesos directos creados correctamente.`r`n")
                } else {
                    $txtLogs.AppendText("[$((Get-Date).ToString('HH:mm:ss'))] ERROR: No se crearon los accesos directos. Recurriendo a metodo directo...`r`n")
                    $ws = New-Object -ComObject WScript.Shell
                    $s1 = $ws.CreateShortcut("$desktop\SIGP - Sistema.lnk")
                    $s1.TargetPath = "wscript.exe"
                    $s1.Arguments = "`"$(Join-Path $Global:destPath "bin\util_lanzador_invisible_sigp.vbs")`""
                    $s1.WorkingDirectory = $Global:destPath
                    $s1.Save()
                    $s2 = $ws.CreateShortcut("$desktop\SIGP - DEBUG.lnk")
                    $s2.TargetPath = "cmd.exe"
                    $s2.Arguments = "/c `"$(Join-Path $Global:destPath "bin\ABRIR_SIGP_DEBUG.bat")`""
                    $s2.WorkingDirectory = $Global:destPath
                    $s2.Save()
                    $txtLogs.AppendText("[$((Get-Date).ToString('HH:mm:ss'))] Accesos creados via metodo directo.`r`n")
                }
            }

            $hasError = $false
            if ($txtLogs.Text -like "*ERROR:*") {
                $hasError = $true
            }
            if ($hasError) {
                $lblDone.Text = "Instalacion Fallida"
                $lblDoneDesc.Text = "Se produjeron errores durante el proceso. Revisa el registro de logs."
                $lblDoneDesc.ForeColor = $colorError
            } else {
                $lblDone.Text = "Instalacion Exitosa"
                $lblDoneDesc.Text = "SIGP esta listo para usarse."
                $lblDoneDesc.ForeColor = $colorMuted
            }

            $page3.Visible = $false
            $page4.Visible = $true
            $btnNext.Text = "Finalizar"
            $btnNext.Enabled = $true
            $Global:Step = 4
        }
    }
})

$Global:Step = if ($sistemaDetectado) { 0 } else { 1 }

$btnNext.Add_Click({
    # --- MODO 0: Sistema Detectado -> Ir a Progreso o Cerrar ---
    if ($Global:Step -eq 0) {
        if ($todoCompleto) { $form.Close(); return }
        $page0.Visible = $false
        $page3.Visible = $true
        $btnNext.Enabled = $false
        $logFile = Join-Path $Global:destPath "install.log"
        if (Test-Path $logFile) { Remove-Item $logFile -Force -ErrorAction SilentlyContinue | Out-Null }

        $Global:Step = 3
        Start-Job -Name "InstaladorJob" -ArgumentList $Global:destPath, $Global:modoSeleccionado, $Global:recrearAccesos, $Global:rootPath -ScriptBlock {
            param($dest, $modo, $accesos, $srcRoot)
            try {
                [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
                $tempDir = [System.IO.Path]::GetTempPath()

                function Run-Cmd {
                    param(
                        [string]$cmd,
                        [string[]]$argsList,
                        [string]$workingDir
                    )
                    if ($workingDir) { Push-Location $workingDir }
                    try {
                        Write-Output "Ejecutando: $cmd $($argsList -join ' ')"
                        $global:LASTEXITCODE = 0
                        & $cmd $argsList 2>&1
                        if ($LASTEXITCODE -ne 0) {
                            throw "El comando '$cmd $($argsList -join ' ')' finalizo con codigo de error $LASTEXITCODE"
                        }
                    } finally {
                        if ($workingDir) { Pop-Location }
                    }
                }

                $tieneB = Test-Path "$dest\backend\node_modules"
                $tieneF = Test-Path "$dest\frontend\node_modules"

                # Buscar Node.js (portable de SICCE o del sistema)
                $nodeLocal = "$srcRoot\..\Proyecto de mejora\node-portable\node-v18.20.2-win-x64\node.exe"
                $npmCmd = "$srcRoot\..\Proyecto de mejora\node-portable\node-v18.20.2-win-x64\npm.cmd"
                if (-not (Test-Path $nodeLocal)) {
                    $nodeLocal = "$dest\node-portable\node-v18.20.2-win-x64\node.exe"
                    $npmCmd = "$dest\node-portable\node-v18.20.2-win-x64\npm.cmd"
                    if (-not (Test-Path $nodeLocal)) {
                        Write-Output "Descargando Node.js v18.20.2 Portable..."
                        $zipPath = Join-Path $tempDir "node-v18.20.2-win-x64.zip"
                        if (!(Test-Path $zipPath)) { Invoke-WebRequest -Uri "https://nodejs.org/dist/v18.20.2/node-v18.20.2-win-x64.zip" -OutFile $zipPath -TimeoutSec 300 }
                        if (Test-Path "$dest\node-portable") {
                            $item = Get-Item "$dest\node-portable"
                            if ($item -isnot [System.IO.DirectoryInfo]) { Remove-Item "$dest\node-portable" -Force -ErrorAction SilentlyContinue | Out-Null }
                        }
                        if (!(Test-Path "$dest\node-portable")) { New-Item -ItemType Directory -Path "$dest\node-portable" -Force | Out-Null }
                        Expand-Archive -Path $zipPath -DestinationPath "$dest\node-portable" -Force
                    }
                }
                $nodeBinDir = Split-Path $nodeLocal -Parent
                $env:Path = "$nodeBinDir;" + [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

                # --- MODO CLEAN ---
                if ($modo -eq "clean") {
                    Write-Output "Modo limpieza: eliminando dependencias existentes..."
                    if (Test-Path "$dest\backend\node_modules") {
                        Remove-Item "$dest\backend\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
                        Write-Output "node_modules backend eliminado."
                    }
                    if (Test-Path "$dest\frontend\node_modules") {
                        Remove-Item "$dest\frontend\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
                        Write-Output "node_modules frontend eliminado."
                    }
                    $tieneB = $false; $tieneF = $false
                }

                # --- BACKEND ---
                if (-not $tieneB -or $modo -eq "update") {
                    if ($modo -eq "update" -and $tieneB) {
                        Write-Output "Actualizando dependencias Backend (npm update)..."
                        Run-Cmd $npmCmd @("update") "$dest\backend"
                    } else {
                        Write-Output "Instalando dependencias Backend..."
                        Run-Cmd $npmCmd @("install") "$dest\backend"
                    }
                } else { Write-Output "Backend Node.js ya instalado. Omitiendo." }

                # --- FRONTEND ---
                if (-not $tieneF -or $modo -eq "update") {
                    if ($modo -eq "update" -and $tieneF) {
                        Write-Output "Actualizando dependencias Frontend (npm update)..."
                        Run-Cmd $npmCmd @("update") "$dest\frontend"
                    } else {
                        Write-Output "Instalando dependencias Frontend..."
                        Run-Cmd $npmCmd @("install") "$dest\frontend"
                    }
                } else { Write-Output "Frontend React ya instalado. Omitiendo." }

                # --- BUILD ---
                Write-Output "Compilando frontend (npm run build)..."
                Run-Cmd $npmCmd @("run", "build") "$dest\frontend"

                # Verificacion
                Write-Output "Verificando integridad de la instalacion..."
                $failVerify = $false
                $missing = @()

                $checkExpress = Join-Path $dest "backend\node_modules\express"
                if (-not (Test-Path $checkExpress)) {
                    $failVerify = $true
                    $missing += "backend\node_modules\express"
                }

                if ($failVerify) {
                    throw "La verificacion post-instalacion fallo. Faltan componentes obligatorios: `n" + ($missing -join "`n")
                }
                Write-Output "Verificacion de integridad exitosa."

                if ($modo -eq "update") { Write-Output "Actualizacion completada." }
                else { Write-Output "Instalacion completada." }

            } catch { Write-Output "ERROR: $($_.Exception.Message)" }
        }
        $timer.Start()

    # --- MODO 1: Bienvenida -> Config ---
    }
    elseif ($Global:Step -eq 1) {
        $page1.Visible = $false
        $page2.Visible = $true
        $Global:Step = 2

    # --- MODO 2: Config -> Instalar ---
    }
    elseif ($Global:Step -eq 2) {
        $Global:destPath = $txtPath.Text
        $page2.Visible = $false
        $page3.Visible = $true
        $btnNext.Enabled = $false
        $logFile = Join-Path $Global:destPath "install.log"
        if (Test-Path $logFile) { Remove-Item $logFile -Force -ErrorAction SilentlyContinue | Out-Null }

        $Global:Step = 3
        Start-Job -Name "InstaladorJob" -ArgumentList $Global:destPath, "full", $true, $Global:rootPath -ScriptBlock {
            param($dest, $modo, $accesos, $srcRoot)
            try {
                [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
                $tempDir = [System.IO.Path]::GetTempPath()

                function Run-Cmd {
                    param(
                        [string]$cmd,
                        [string[]]$argsList,
                        [string]$workingDir
                    )
                    if ($workingDir) { Push-Location $workingDir }
                    try {
                        Write-Output "Ejecutando: $cmd $($argsList -join ' ')"
                        $global:LASTEXITCODE = 0
                        & $cmd $argsList 2>&1
                        if ($LASTEXITCODE -ne 0) {
                            throw "El comando '$cmd $($argsList -join ' ')' finalizo con codigo de error $LASTEXITCODE"
                        }
                    } finally {
                        if ($workingDir) { Pop-Location }
                    }
                }

                Stop-Process -Name node -Force -ErrorAction SilentlyContinue
                Start-Sleep 1

                if ($srcRoot -ne $dest) {
                    Write-Output "Copiando proyecto de $srcRoot a $dest"
                    if (!(Test-Path $dest)) { New-Item -ItemType Directory -Path $dest -Force | Out-Null }
                    Copy-Item -Path "$srcRoot\*" -Destination $dest -Recurse -Force
                }

                # Buscar node portable (intentar SICCE primero, luego descargar propio)
                $nodeLocal = "$srcRoot\..\Proyecto de mejora\node-portable\node-v18.20.2-win-x64\node.exe"
                $npmCmd = "$srcRoot\..\Proyecto de mejora\node-portable\node-v18.20.2-win-x64\npm.cmd"
                if (-not (Test-Path $nodeLocal)) {
                    $nodeLocal = "$dest\node-portable\node-v18.20.2-win-x64\node.exe"
                    $npmCmd = "$dest\node-portable\node-v18.20.2-win-x64\npm.cmd"
                    if (-not (Test-Path $nodeLocal)) {
                        Write-Output "Descargando Node.js v18.20.2 Portable..."
                        $zipPath = Join-Path $tempDir "node-v18.20.2-win-x64.zip"
                        if (!(Test-Path $zipPath)) { Invoke-WebRequest -Uri "https://nodejs.org/dist/v18.20.2/node-v18.20.2-win-x64.zip" -OutFile $zipPath -TimeoutSec 300 }
                        if (Test-Path "$dest\node-portable") {
                            $item = Get-Item "$dest\node-portable"
                            if ($item -isnot [System.IO.DirectoryInfo]) { Remove-Item "$dest\node-portable" -Force -ErrorAction SilentlyContinue | Out-Null }
                        }
                        if (!(Test-Path "$dest\node-portable")) { New-Item -ItemType Directory -Path "$dest\node-portable" -Force | Out-Null }
                        Expand-Archive -Path $zipPath -DestinationPath "$dest\node-portable" -Force
                    }
                }
                $nodeBinDir = Split-Path $nodeLocal -Parent
                $env:Path = "$nodeBinDir;" + [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

                if (-not (Test-Path "$dest\backend\.env")) {
                    Write-Output "Creando archivo .env..."
                    $envContent = @"
MONGO_URI=mongodb+srv://usuario:contrasena@cluster0.xxxxx.mongodb.net/user_sicce
JWT_SECRET=super-secret-key-sicce
PORT=3006
DB_PREFIX=sicce_
"@
                    Set-Content -Path "$dest\backend\.env" -Value $envContent -Encoding ASCII
                }

                Write-Output "Instalando dependencias Backend..."
                Run-Cmd $npmCmd @("install") "$dest\backend"
                Write-Output "Instalando dependencias Frontend..."
                Run-Cmd $npmCmd @("install") "$dest\frontend"
                Write-Output "Compilando Frontend..."
                Run-Cmd $npmCmd @("run", "build") "$dest\frontend"

                # Verificacion
                Write-Output "Verificando integridad..."
                $checkExpress = Join-Path $dest "backend\node_modules\express"
                if (-not (Test-Path $checkExpress)) {
                    throw "La verificacion post-instalacion fallo: no se encontro express"
                }
                Write-Output "Verificacion exitosa."
                Write-Output "Instalacion completada."

            } catch { Write-Output "ERROR: $($_.Exception.Message)" }
        }
        $timer.Start()

    # --- MODO 4: Cerrar ---
    }
    elseif ($Global:Step -eq 4) { $form.Close() }
})

# --- Mostrar ---
$form.Add_Shown({
    if (-not $sistemaDetectado) { $btnNext.Enabled = $false }
})
$form.ShowDialog()
