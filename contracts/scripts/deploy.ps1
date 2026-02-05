# PowerShell deployment script for Windows

Write-Host "🚀 MemeFi Contract Deployment" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check Sui CLI
try {
    $suiVersion = sui --version
    Write-Host "✅ Sui CLI found: $suiVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Sui CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Build contracts
Write-Host ""
Write-Host "📦 Building contracts..." -ForegroundColor Yellow
Set-Location $PSScriptRoot\..
sui move build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

# Run tests
Write-Host ""
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
sui move test

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Tests failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tests passed" -ForegroundColor Green

# Deploy
Write-Host ""
Write-Host "🌐 Deploying to network..." -ForegroundColor Cyan
Write-Host "Select network:"
Write-Host "1) Devnet (recommended for testing)"
Write-Host "2) Testnet"
$network_choice = Read-Host "Enter choice (1-2)"

switch ($network_choice) {
    "1" { $NETWORK = "devnet" }
    "2" { $NETWORK = "testnet" }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Deploying to $NETWORK..." -ForegroundColor Yellow

# Deploy with sufficient gas
sui client publish --gas-budget 100000000 --skip-dependency-verification

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Important: Save the package ID from the output above" -ForegroundColor Cyan
    Write-Host "    You'll need it for frontend integration"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Copy the package ID"
    Write-Host "2. Update frontend config with the package ID"
    Write-Host "3. Test the integration"
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}
