# EduBek — Windows Setup Script (PowerShell)
# Run: powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1
#
# This script sets up the EduBek development environment on Windows:
#   1. Installs npm dependencies
#   2. Generates Prisma client
#   3. Runs database migrations
#   4. Seeds the database
#   5. Runs the test suite
#   6. Builds the production bundle

param(
    [string]$DatabaseUrl = "",
    [string]$OpenRouterKey = ""
)

$ErrorActionPreference = "Stop"
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  EduBek — Windows Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Step 1: Check prerequisites
Write-Host "`n[1/6] Checking prerequisites..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "  ERROR: Node.js is not installed. Download from https://nodejs.org" -ForegroundColor Red
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "  ERROR: npm is not installed." -ForegroundColor Red
    exit 1
}
$nodeVersion = node -v
Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green

# Step 2: Install dependencies
Write-Host "`n[2/6] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "  ERROR: npm install failed" -ForegroundColor Red; exit 1 }
Write-Host "  Dependencies installed." -ForegroundColor Green

# Step 3: Create .env if it doesn't exist
Write-Host "`n[3/6] Configuring .env..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  Created .env from .env.example" -ForegroundColor Green
    Write-Host "  Edit .env to set your DATABASE_URL and OPENROUTER_API_KEY" -ForegroundColor Yellow
} else {
    Write-Host "  .env already exists." -ForegroundColor Green
}

# Override with provided values
if ($DatabaseUrl) {
    (Get-Content ".env") -replace '^DATABASE_URL=.*', "DATABASE_URL=$DatabaseUrl" | Set-Content ".env"
    Write-Host "  Set DATABASE_URL" -ForegroundColor Green
}
if ($OpenRouterKey) {
    (Get-Content ".env") -replace '^OPENROUTER_API_KEY=.*', "OPENROUTER_API_KEY=$OpenRouterKey" | Set-Content ".env"
    Write-Host "  Set OPENROUTER_API_KEY" -ForegroundColor Green
}

# Step 4: Generate Prisma + migrate
Write-Host "`n[4/6] Setting up database..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Host "  ERROR: prisma generate failed" -ForegroundColor Red; exit 1 }
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { Write-Host "  ERROR: prisma migrate failed" -ForegroundColor Red; exit 1 }
Write-Host "  Database migrated." -ForegroundColor Green

# Step 5: Seed (optional)
Write-Host "`n[5/6] Seeding database..." -ForegroundColor Yellow
npx tsx scripts/seed.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "  WARNING: Seed failed (non-fatal)" -ForegroundColor Yellow
} else {
    Write-Host "  Database seeded." -ForegroundColor Green
}

# Step 6: Run tests
Write-Host "`n[6/6] Running tests..." -ForegroundColor Yellow
npx vitest run
if ($LASTEXITCODE -ne 0) { Write-Host "  WARNING: Some tests failed" -ForegroundColor Yellow }

Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor White
Write-Host "  npm run dev          # Start dev server" -ForegroundColor Gray
Write-Host "  npm run build        # Production build" -ForegroundColor Gray
Write-Host "  npm start            # Start production server" -ForegroundColor Gray
