<#
Helper to start the Python API on Windows (PowerShell).
Usage (from repo root):
  powershell -ExecutionPolicy Bypass -File server\run_api.ps1
Or run this file directly from PowerShell.
#>

param(
    [string]$DbServer = '(localdb)\MyInstance',
    [string]$DbName = 'DataFlow',
    [string]$PythonExe = ''
)

$env:DB_SERVER = $DbServer
$env:DB_DATABASE = $DbName

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $scriptDir

Write-Host "Starting API with DB_SERVER=$env:DB_SERVER DB_DATABASE=$env:DB_DATABASE"
function Resolve-PythonCommand {
    param([string]$RequestedExe)

    $candidates = New-Object System.Collections.Generic.List[string]

    if ($RequestedExe) {
        $candidates.Add($RequestedExe)
    }

    if ($env:VIRTUAL_ENV) {
        $venvPython = Join-Path $env:VIRTUAL_ENV 'Scripts\python.exe'
        if (Test-Path $venvPython) {
            $candidates.Add($venvPython)
        }
    }

    $candidates.Add('py')
    $candidates.Add('python')

    foreach ($candidate in $candidates) {
        if ($candidate -and (Get-Command $candidate -ErrorAction SilentlyContinue)) {
            return $candidate
        }
    }

    return $null
}

$exeToUse = Resolve-PythonCommand -RequestedExe $PythonExe
if (-not $exeToUse) {
    Write-Error "No Python executable found. Please install Python or activate a virtual environment."
    Pop-Location
    exit 1
}

if ($exeToUse -eq 'python') {
    Write-Host "Python executable 'python' detected on PATH. If this opens the Store prompt, activate the virtualenv or install the real interpreter."
}

try {
    & $exeToUse .\py_api_service.py
} finally {
    Pop-Location
}
