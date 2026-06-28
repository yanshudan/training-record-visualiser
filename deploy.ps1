# Build and deploy the app to an Azure Static Web App.
#
# Prerequisites:
#   - Azure CLI installed and logged in:  az login
#   - Node.js + npm available on PATH (the SWA CLI is run via npx)
#
# Usage:
#   ./deploy.ps1                 # build + deploy (creates the SWA if missing)
#   ./deploy.ps1 -SkipBuild      # deploy the existing ./build folder
#
# The script creates the Static Web App in "manual deploy" mode (no GitHub repo
# attached) and pushes the local ./build folder using the SWA CLI.

[CmdletBinding()]
param(
    [string]$Name = "training-record-visualiser",
    [string]$ResourceGroup = "training-record-rg",
    [string]$Location = "eastasia",
    [string]$Source = "build",
    [string]$Environment = "production",
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

# Ensure the resource group exists.
$rgExists = az group exists --name $ResourceGroup | ConvertFrom-Json
if (-not $rgExists) {
    Write-Host "==> Creating resource group '$ResourceGroup'..." -ForegroundColor Cyan
    az group create --name $ResourceGroup --location $Location | Out-Null
}

# Ensure the Static Web App exists (manual deploy mode: no --source/--branch).
Write-Host "==> Ensuring Static Web App '$Name' exists..." -ForegroundColor Cyan
$swa = az staticwebapp show --name $Name --resource-group $ResourceGroup 2>$null | ConvertFrom-Json
if (-not $swa) {
    Write-Host "    Creating Static Web App '$Name'..." -ForegroundColor Cyan
    az staticwebapp create `
        --name $Name `
        --resource-group $ResourceGroup `
        --location $Location `
        --sku Free | Out-Null
}

# Fetch the deployment token for the manual deploy.
Write-Host "==> Fetching deployment token..." -ForegroundColor Cyan
$token = az staticwebapp secrets list `
    --name $Name `
    --resource-group $ResourceGroup `
    --query "properties.apiKey" -o tsv

if ([string]::IsNullOrWhiteSpace($token)) {
    throw "Could not retrieve a deployment token for Static Web App '$Name'."
}

Write-Host "==> Deploying '$Source' to '$Name' ($Environment)..." -ForegroundColor Cyan
npx --yes @azure/static-web-apps-cli deploy $Source `
    --deployment-token $token `
    --env $Environment

$hostName = az staticwebapp show --name $Name --resource-group $ResourceGroup --query "defaultHostname" -o tsv
Write-Host "==> Done. Live at: https://$hostName" -ForegroundColor Green
