#!/bin/bash

# MemeFi Smart Contract Deployment Script

echo "🚀 MemeFi Contract Deployment"
echo "=============================="

# Check Sui CLI
if ! command -v sui &> /dev/null; then
    echo "❌ Sui CLI not found. Please install it first."
    exit 1
fi

echo "✅ Sui CLI found"

# Build contracts
echo ""
echo "📦 Building contracts..."
cd "$(dirname "$0")/.."
sui move build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# Run tests
echo ""
echo "🧪 Running tests..."
sui move test

if [ $? -ne 0 ]; then
    echo "❌ Tests failed"
    exit 1
fi

echo "✅ Tests passed"

# Deploy
echo ""
echo "🌐 Deploying to network..."
echo "Select network:"
echo "1) Devnet (recommended for testing)"
echo "2) Testnet"
read -p "Enter choice (1-2): " network_choice

case $network_choice in
    1)
        NETWORK="devnet"
        ;;
    2)
        NETWORK="testnet"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo "Deploying to $NETWORK..."

# Deploy with sufficient gas
sui client publish --gas-budget 100000000 --skip-dependency-verification

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "📝 Important: Save the package ID from the output above"
    echo "    You'll need it for frontend integration"
    echo ""
    echo "Next steps:"
    echo "1. Copy the package ID"
    echo "2. Update frontend config with the package ID"
    echo "3. Test the integration"
else
    echo "❌ Deployment failed"
    exit 1
fi
