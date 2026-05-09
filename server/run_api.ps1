<#
Helper to start the Python API on Windows (PowerShell).
Usage (from repo root):
  powershell -ExecutionPolicy Bypass -File server\run_api.ps1
Or run this file directly from PowerShell.
#>

param(
    [string]$DbServer = '(localdb)\MyInstance',
    [string]$DbName = 'DataFlow',
    [string]$PythonExe = 'python'
)

$env:DB_SERVER = $DbServer
$env:DB_DATABASE = $DbName

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $scriptDir

Write-Host "Starting API with DB_SERVER=$env:DB_SERVER DB_DATABASE=$env:DB_DATABASE"
try {
    & $PythonExe .\py_api_service.py
} finally {
    Pop-Location
}
