# Start Backend and Frontend Servers
Write-Host "Stopping any existing node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "`nStarting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 's:\FullStack\Industry_PR\Flowmen-common\BackEnd'; npm run dev"

Start-Sleep -Seconds 5

Write-Host "Starting Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 's:\FullStack\Industry_PR\Flowmen-common\Frontend'; npm run dev"

Start-Sleep -Seconds 3

Write-Host "`n✅ Servers started!" -ForegroundColor Green
Write-Host "Backend: http://localhost:4000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "`nPress any key to check server status..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Get-NetTCPConnection -LocalPort 4000,5173 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalPort, State
