# Build and deploy the app to the Azure Blob static website ($web container).
#
# Prerequisites:
#   - Azure CLI installed and logged in:  az login
#   - Node.js + npm available on PATH
#
# Usage:
#   ./deploy.ps1                 # build + deploy
#   ./deploy.ps1 -SkipBuild      # deploy the existing ./build folder

[CmdletBinding()]
param(
    [string]$AccountName = "hq3backup",
    [string]$Source = "build",
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

if (-not $SkipBuild) {
    Write-Host "==> Building..." -ForegroundColor Cyan
    npm ci
    npm run build
}

if (-not (Test-Path $Source)) {
    throw "Source folder '$Source' not found. Run a build first or pass -Source."
}

Write-Host "==> Uploading '$Source' to `$web on '$AccountName'..." -ForegroundColor Cyan
az storage blob upload-batch `
    --account-name $AccountName `
    --source $Source `
    --destination '$web' `
    --overwrite true

Write-Host "==> Done." -ForegroundColor Green
