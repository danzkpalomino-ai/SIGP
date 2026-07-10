<# 
.SYNOPSIS
    Limpia los puertos usados por SIGP (backend 3006, frontend 5174).
#>
Write-Host "[SIGP] Liberando puertos 3006 y 5174..." -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort 3006,5174 -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1
Write-Host "[SIGP] Puertos liberados." -ForegroundColor Green