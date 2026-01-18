# Render Build Script
# This ensures the frontend is built during deployment

echo "📦 Building frontend..."
cd frontend
npm ci
npm run build
echo "✅ Frontend build complete"

echo "📦 Installing backend dependencies..."
cd ../backend
npm ci --production --silent
echo "✅ Backend dependencies installed"

echo "🚀 Build complete! Ready to start server..."
