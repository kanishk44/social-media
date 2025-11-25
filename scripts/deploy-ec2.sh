#!/bin/bash

# EC2 Deployment Script
# Usage: ./scripts/deploy-ec2.sh <ec2-user@host>

set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/deploy-ec2.sh <ec2-user@host>"
  exit 1
fi

EC2_HOST=$1
APP_DIR="/home/ubuntu/social-media-backend"

echo "🚀 Deploying to EC2: $EC2_HOST"

# Build locally
echo "📦 Building application..."
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm build

# Create deployment package
echo "📁 Creating deployment package..."
tar -czf deployment.tar.gz \
  dist/ \
  node_modules/ \
  prisma/ \
  package.json \
  pnpm-lock.yaml \
  .env.example

# Upload to EC2
echo "⬆️  Uploading to EC2..."
ssh $EC2_HOST "mkdir -p $APP_DIR"
scp deployment.tar.gz $EC2_HOST:$APP_DIR/

# Deploy on EC2
echo "🔧 Installing on EC2..."
ssh $EC2_HOST << 'EOF'
  cd $APP_DIR
  
  # Extract files
  tar -xzf deployment.tar.gz
  rm deployment.tar.gz
  
  # Run migrations
  pnpm prisma:migrate deploy
  
  # Restart PM2
  pm2 restart social-media-backend || pm2 start dist/server.js --name social-media-backend
  pm2 save
EOF

# Cleanup
rm deployment.tar.gz

echo "✅ Deployment complete!"
echo "🔍 Check status: ssh $EC2_HOST 'pm2 status'"
echo "📋 View logs: ssh $EC2_HOST 'pm2 logs social-media-backend'"

