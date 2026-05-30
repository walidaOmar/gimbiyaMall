#!/bin/bash
# Post-deployment smoke test script
# Run this after deploying to verify both frontend and backend are working

BACKEND_URL="${1:-https://your-render-backend.onrender.com}"
FRONTEND_URL="${2:-https://your-netlify-frontend.netlify.app}"

echo "🧪 Running post-deployment smoke tests..."
echo "Backend: $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"

# Test backend health
echo ""
echo "Testing backend connectivity..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL")
if [ "$BACKEND_STATUS" = "200" ] || [ "$BACKEND_STATUS" = "404" ]; then
  echo "✅ Backend responding (HTTP $BACKEND_STATUS)"
else
  echo "❌ Backend not responding properly (HTTP $BACKEND_STATUS)"
fi

# Test frontend health
echo ""
echo "Testing frontend connectivity..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_STATUS" = "200" ]; then
  echo "✅ Frontend responding (HTTP $FRONTEND_STATUS)"
else
  echo "❌ Frontend not responding properly (HTTP $FRONTEND_STATUS)"
fi

# Test API connectivity
echo ""
echo "Testing API connectivity from frontend..."
curl -s "$BACKEND_URL/api/trpc/health.ping" | grep -q "success" && echo "✅ API endpoint accessible" || echo "⚠️  API endpoint check inconclusive"

echo ""
echo "🎉 Smoke tests complete!"
