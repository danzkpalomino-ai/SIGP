Add-Type -AssemblyName System.Windows.Forms, System.Drawing

$Global:setupPath = $PSScriptRoot
$Global:rootPath = (Resolve-Path "$Global:setupPath\..").Path
$bannerPath = Join-Path $Global:setupPath "banner.png"

# --- Colores SICCE/SIGP ---
$colorBg = "#f5efe6"
$colorSidebar = "#e8dfd2"
$colorAccent = "#1a1916"
$colorMuted = "#6b6960"
$colorSuccess = "#059669"
$colorError = "#dc2626"

# --- Ventana principal ---
$form = New-Object System.Windows.Forms.Form
$form.Text = "SIGP — Instalador"
$form.Size = New-Object Drawing.Size(800, 500)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.BackColor = $colorBg
$form.Icon = $null

# --- Banner ---
$picBanner = New-Object System.Windows.Forms.PictureBox
$picBanner.Size = New-Object Drawing.Size(800, 100)
$picBanner.Location = New-Object Drawing.Point(0, 0)
$picBanner.SizeMode = "Zoom"
$picBanner.BackColor = $colorAccent
if (Test-Path $bannerPath) {
    $picBanner.Image = [System.Drawing.Image]::FromFile($bannerPath)
} else {
    $picBanner.BackColor = $colorAccent
}
$form.Controls.Add($picBanner)

# --- Sidebar ---
$sidebar = New-Object System.Windows.Forms.Panel
$sidebar.Size = New-Object Drawing.Size(200, 400)
$sidebar.Location = New-Object Drawing.Point(0, 100)
$sidebar.BackColor = $colorSidebar
$form.Controls.Add($sidebar)

# --- Título en sidebar ---
$lblSidebar = New-Object System.Windows.Forms.Label
$lblSidebar.Text = "SIGP"
$lblSidebar.Location = New-Object Drawing.Point(20, 30)
$lblSidebar.Size = New-Object Drawing.Size(160, 30)
$lblSidebar.Font = New-Object Drawing.Font("Segoe UI", 18, [Drawing.FontStyle]::Bold)
$lblSidebar.ForeColor = $colorAccent
$sidebar.Controls.Add($lblSidebar)

$lblSidebarDesc = New-Object System.Windows.Forms.Label
$lblSidebarDesc.Text = "Sistema de Gestión de Puntos"
$lblSidebarDesc.Location = New-Object Drawing.Point(20, 65)
$lblSidebarDesc.Size = New-Object Drawing.Size(160, 40)
$lblSidebarDesc.Font = New-Object Drawing.Font("Segoe UI", 10)
$lblSidebarDesc.ForeColor = $colorMuted
$sidebar.Controls.Add($lblSidebarDesc)

# --- Pasos en sidebar ---
$steps = @(
    "Preparando instalacion",
    "Instalando dependencias",
    "Creando accesos directos",
    "Instalacion completada"
)
$stepLabels = @()
for ($i = 0; $i -lt $steps.Length; $i++) {
    $lbl = New-Object System.Windows.Forms.Label
    $lbl.Text = "  $(($i+1)). $($steps[$i])"
    $lbl.Location = New-Object Drawing.Point(15, (110 + $i * 35))
    $lbl.Size = New-Object Drawing.Size(170, 25)
    $lbl.Font = New-Object Drawing.Font("Segoe UI", 9.5, [Drawing.FontStyle]::Bold)
    $lbl.ForeColor = "#9e9c94"
    $lbl.Tag = $i
    $sidebar.Controls.Add($lbl)
    $stepLabels += $lbl
}

function Set-StepActive($index) {
    for ($i = 0; $i -lt $stepLabels.Length; $i++) {
        if ($i -eq $index) {
            $stepLabels[$i].ForeColor = $colorAccent
            $stepLabels[$i].Text = $stepLabels[$i].Text -replace "^  ", " >"
        } else {
            $stepLabels[$i].ForeColor = "#9e9c94"
            $stepLabels[$i].Text = $stepLabels[$i].Text -replace "^ >", "  "
        }
    }
}

# --- Panel principal ---
$mainPanel = New-Object System.Windows.Forms.Panel
$mainPanel.Size = New-Object Drawing.Size(600, 400)
$mainPanel.Location = New-Object Drawing.Point(200, 100)
$form.Controls.Add($mainPanel)

# --- Página 1: Inicio ---
$page1 = New-Object System.Windows.Forms.Panel
$page1.Size = $mainPanel.Size

$lblWelcome = New-Object System.Windows.Forms.Label
$lblWelcome.Text = "¡Bienvenido a SIGP!"
$lblWelcome.Location = New-Object Drawing.Point(40, 40)
$lblWelcome.Size = New-Object Drawing.Size(500, 35)
$lblWelcome.Font = New-Object Drawing.Font("Segoe UI", 20, [Drawing.FontStyle]::Bold)
$lblWelcome.ForeColor = $colorAccent
$page1.Controls.Add($lblWelcome)

$lblWelcomeDesc = New-Object System.Windows.Forms.Label
$lblWelcomeDesc.Text = "Sistema complementario de SICCE para Punto de Venta en tiempo real,`ncompras en vivo y gestión de productos con códigos POS."
$lblWelcomeDesc.Location = New-Object Drawing.Point(40, 85)
$lblWelcomeDesc.Size = New-Object Drawing.Size(500, 50)
$lblWelcomeDesc.Font = New-Object Drawing.Font("Segoe UI", 10)
$lblWelcomeDesc.ForeColor = $colorMuted
$page1.Controls.Add($lblWelcomeDesc)

$chkShortcuts = New-Object System.Windows.Forms.CheckBox
$chkShortcuts.Text = "Crear accesos directos en el Escritorio"
$chkShortcuts.Location = New-Object Drawing.Point(40, 180)
$chkShortcuts.Size = New-Object Drawing.Size(350, 25)
$chkShortcuts.Checked = $true
$chkShortcuts.Font = New-Object Drawing.Font("Segoe UI", 10)
$page1.Controls.Add($chkShortcuts)

$lblInfo = New-Object System.Windows.Forms.Label
$lblInfo.Text = "SIGP se instalará en:`n$($Global:rootPath)"
$lblInfo.Location = New-Object Drawing.Point(40, 230)
$lblInfo.Size = New-Object Drawing.Size(500, 40)
$lblInfo.Font = New-Object Drawing.Font("Segoe UI", 9)
$lblInfo.ForeColor = $colorMuted
$page1.Controls.Add($lblInfo)

$mainPanel.Controls.Add($page1)

# --- Página 2: Progreso ---
$page2 = New-Object System.Windows.Forms.Panel
$page2.Size = $mainPanel.Size
$page2.Visible = $false

$lblProgress = New-Object System.Windows.Forms.Label
$lblProgress.Text = "Instalando..."
$lblProgress.Location = New-Object Drawing.Point(40, 30)
$lblProgress.Size = New-Object Drawing.Size(500, 25)
$lblProgress.Font = New-Object Drawing.Font("Segoe UI", 14, [Drawing.FontStyle]::Bold)
$lblProgress.ForeColor = $colorAccent
$page2.Controls.Add($lblProgress)

$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Location = New-Object Drawing.Point(40, 70)
$progressBar.Size = New-Object Drawing.Size(500, 20)
$progressBar.Style = "Continuous"
$page2.Controls.Add($progressBar)

$txtLogs = New-Object System.Windows.Forms.TextBox
$txtLogs.Location = New-Object Drawing.Point(40, 110)
$txtLogs.Size = New-Object Drawing.Size(500, 200)
$txtLogs.Multiline = $true
$txtLogs.ReadOnly = $true
$txtLogs.ScrollBars = "Vertical"
$txtLogs.Font = New-Object Drawing.Font("Consolas", 9)
$txtLogs.BackColor = "#faf7f2"
$page2.Controls.Add($txtLogs)

$mainPanel.Controls.Add($page2)

# --- Página 3: Finalización ---
$page3 = New-Object System.Windows.Forms.Panel
$page3.Size = $mainPanel.Size
$page3.Visible = $false

$lblDone = New-Object System.Windows.Forms.Label
$lblDone.Text = "Instalación Completada"
$lblDone.Location = New-Object Drawing.Point(40, 50)
$lblDone.Size = New-Object Drawing.Size(500, 35)
$lblDone.Font = New-Object Drawing.Font("Segoe UI", 18, [Drawing.FontStyle]::Bold)
$lblDone.ForeColor = $colorAccent
$page3.Controls.Add($lblDone)

$lblDoneDesc = New-Object System.Windows.Forms.Label
$lblDoneDesc.Text = "SIGP está listo para usarse. Los accesos directos se crearon en tu Escritorio."
$lblDoneDesc.Location = New-Object Drawing.Point(40, 95)
$lblDoneDesc.Size = New-Object Drawing.Size(500, 40)
$lblDoneDesc.Font = New-Object Drawing.Font("Segoe UI", 10)
$lblDoneDesc.ForeColor = $colorMuted
$page3.Controls.Add($lblDoneDesc)

$lblDoneInfo = New-Object System.Windows.Forms.Label
$lblDoneInfo.Text = ""
$lblDoneInfo.Location = New-Object Drawing.Point(40, 150)
$lblDoneInfo.Size = New-Object Drawing.Size(500, 80)
$lblDoneInfo.Font = New-Object Drawing.Font("Segoe UI", 9)
$lblDoneInfo.ForeColor = $colorMuted
$page3.Controls.Add($lblDoneInfo)

$mainPanel.Controls.Add($page3)

# --- Botón Siguiente ---
$btnNext = New-Object System.Windows.Forms.Button
$btnNext.Text = "Instalar"
$btnNext.Location = New-Object Drawing.Point(560, 420)
$btnNext.Size = New-Object Drawing.Size(200, 35)
$btnNext.Font = New-Object Drawing.Font("Segoe UI", 10, [Drawing.FontStyle]::Bold)
$btnNext.BackColor = $colorAccent
$btnNext.ForeColor = "White"
$btnNext.FlatStyle = "Flat"
$btnNext.Cursor = "Hand"
$form.Controls.Add($btnNext)

# --- Botón Cerrar ---
$btnClose = New-Object System.Windows.Forms.Button
$btnClose.Text = "Cerrar"
$btnClose.Location = New-Object Drawing.Point(440, 420)
$btnClose.Size = New-Object Drawing.Size(100, 35)
$btnClose.Font = New-Object Drawing.Font("Segoe UI", 10)
$btnClose.BackColor = "White"
$btnClose.ForeColor = $colorAccent
$btnClose.FlatStyle = "Flat"
$btnClose.Cursor = "Hand"
$btnClose.Visible = $false
$form.Controls.Add($btnClose)

# --- Estado global ---
$Global:Step = 1
$hasError = $false

# --- Funciones ---
function Write-Log($msg) {
    $txtLogs.AppendText("[$((Get-Date).ToString('HH:mm:ss'))] $msg`r`n")
}

function New-Shortcuts {
    param([string]$destPath)
    $desktop = [Environment]::GetFolderPath("Desktop")
    $ws = New-Object -ComObject WScript.Shell

    # SIGP - Sistema.lnk (lanza invisible con wscript)
    $s1 = $ws.CreateShortcut("$desktop\SIGP - Sistema.lnk")
    $s1.TargetPath = "wscript.exe"
    $s1.Arguments = "`"$(Join-Path $destPath "bin\util_lanzador_invisible_sigp.vbs")`""
    $s1.WorkingDirectory = $destPath
    $s1.Description = "SIGP — Sistema de Gestión de Puntos"
    $s1.Save()
    Write-Log "Creado acceso directo: SIGP - Sistema"

    # SIGP - DEBUG.lnk (abre consola visible)
    $s2 = $ws.CreateShortcut("$desktop\SIGP - DEBUG.lnk")
    $s2.TargetPath = "cmd.exe"
    $s2.Arguments = "/c `"$(Join-Path $destPath "bin\ABRIR_SIGP_DEBUG.bat")`""
    $s2.WorkingDirectory = $destPath
    $s2.Description = "SIGP — Modo Debug (consola visible)"
    $s2.Save()
    Write-Log "Creado acceso directo: SIGP - DEBUG"

    # Verificar
    $existeSistema = Test-Path (Join-Path $desktop "SIGP - Sistema.lnk")
    $existeDebug = Test-Path (Join-Path $desktop "SIGP - DEBUG.lnk")
    if ($existeSistema -and $existeDebug) {
        Write-Log "Accesos directos creados correctamente."
    } else {
        Write-Log "ERROR: No se pudieron crear los accesos directos."
    }
}

# --- Evento del botón Siguiente ---
$btnNext.Add_Click({
    if ($Global:Step -eq 1) {
        # Iniciar instalación
        $page1.Visible = $false
        $page2.Visible = $true
        $btnNext.Enabled = $false
        $btnNext.Text = "Instalando..."
        Set-StepActive(1)
        $form.Refresh()

        # Ejecutar instalación en segundo plano
        [System.Windows.Forms.Application]::DoEvents()

        # Paso 1: Backend
        Set-StepActive(1)
        Write-Log "Instalando dependencias del backend..."
        $progressBar.Value = 10
        $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$Global:rootPath\backend`" && npm install" -NoNewWindow -Wait -PassThru
        if ($proc.ExitCode -ne 0) {
            Write-Log "ERROR: Falló la instalación del backend"
            $hasError = $true
        } else {
            Write-Log "Backend instalado correctamente"
        }

        # Paso 2: Frontend
        $progressBar.Value = 40
        [System.Windows.Forms.Application]::DoEvents()
        Write-Log "Instalando dependencias del frontend..."
        $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$Global:rootPath\frontend`" && npm install" -NoNewWindow -Wait -PassThru
        if ($proc.ExitCode -ne 0) {
            Write-Log "ERROR: Falló la instalación del frontend"
            $hasError = $true
        } else {
            Write-Log "Frontend instalado correctamente"
        }

        # Paso 3: Build
        $progressBar.Value = 65
        [System.Windows.Forms.Application]::DoEvents()
        Write-Log "Compilando frontend..."
        $proc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d `"$Global:rootPath\frontend`" && npm run build" -NoNewWindow -Wait -PassThru
        if ($proc.ExitCode -ne 0) {
            Write-Log "ERROR: Falló la compilación del frontend"
            $hasError = $true
        } else {
            Write-Log "Frontend compilado correctamente"
        }

        # Paso 4: Accesos directos
        $progressBar.Value = 85
        [System.Windows.Forms.Application]::DoEvents()
        if ($chkShortcuts.Checked) {
            Set-StepActive(2)
            Write-Log "Creando accesos directos..."
            New-Shortcuts -destPath $Global:rootPath
        }

        # Finalizar
        $progressBar.Value = 100
        Set-StepActive(3)

        if ($hasError) {
            $lblDone.Text = "Instalación Fallida"
            $lblDoneDesc.Text = "Se produjeron errores. Revisa el registro de logs."
            $lblDoneDesc.ForeColor = $colorError
        } else {
            $lblDone.Text = "Instalación Exitosa"
            $lblDoneDesc.ForeColor = $colorMuted
            $lblDoneInfo.Text = "Accesos directos creados:`n  - SIGP - Sistema (inicio silencioso)`n  - SIGP - DEBUG (consola visible)`n`nPara iniciar, abre SIGP - Sistema desde tu Escritorio.`nLuego visita http://localhost:5174 o http://localhost:3006"
        }

        $page2.Visible = $false
        $page3.Visible = $true
        $btnNext.Visible = $false
        $btnClose.Visible = $true
    }
})

# --- Evento Cerrar ---
$btnClose.Add_Click({ $form.Close() })

# --- Evento Cerrar ventana ---
$form.Add_FormClosing({
    param($sender, $e)
    if ($Global:Step -eq 2) { $e.Cancel = $true }
})

# --- Mostrar ---
$form.ShowDialog()
