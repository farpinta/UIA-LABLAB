#!/bin/bash

# BobInsight Frontend Rebuild Script
# Use this to rebuild the frontend after CSP or environment changes

echo "🔄 Rebuilding BobInsight Frontend..."
echo ""

# Stop running containers
echo "1️⃣ Stopping containers..."
docker-compose down

# Remove old frontend image to force rebuild
echo "2️⃣ Removing old frontend image..."
docker rmi bobinsight-monorepo-frontend 2>/dev/null || echo "   No old image to remove"

# Rebuild frontend with no cache
echo "3️⃣ Rebuilding frontend (this may take a few minutes)..."
docker-compose build --no-cache frontend

# Start containers
echo "4️⃣ Starting containers..."
docker-compose up -d

# Wait for services to be healthy
echo "5️⃣ Waiting for services to be healthy..."
sleep 5

# Check status
echo ""
echo "✅ Rebuild complete!"
echo ""
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "🔍 Testing backend health..."
curl -s http://localhost:3000/health | jq . || echo "Backend not responding yet"

echo ""
echo "🌐 Frontend should be available at: http://localhost:5173"
echo "🔧 Backend API available at: http://localhost:3000"
echo ""
echo "💡 Check browser console to verify API URL is now: https://uia-bobinsight-api.pinont.me"

# Made with Bob
