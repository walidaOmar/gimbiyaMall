#!/bin/bash
# Pre-deployment validation script

echo "🔍 Running deployment validation..."

# Check Node version
echo "✓ Node version:"
node --version

# Check npm version
echo "✓ npm version:"
npm --version

# TypeScript check
echo "✓ TypeScript type checking..."
npm run check

if [ $? -ne 0 ]; then
  echo "❌ TypeScript check failed. Fix errors before deploying."
  exit 1
fi

# Build test
echo "✓ Testing build..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Fix errors before deploying."
  exit 1
fi

echo "✅ All validation checks passed! Ready to deploy."
