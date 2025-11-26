#!/bin/bash

# EC2 Deployment Script
# Usage: ./scripts/deploy-ec2.sh <ec2-user@host> [path-to-pem-file]
# Example: ./scripts/deploy-ec2.sh ubuntu@ec2-xxx.compute-1.amazonaws.com ~/.ssh/my-key.pem

set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/deploy-ec2.sh <ec2-user@host> [path-to-pem-file]"
  echo "Example: ./scripts/deploy-ec2.sh ubuntu@ec2-xxx.compute-1.amazonaws.com ~/.ssh/my-key.pem"
  exit 1
fi

EC2_HOST=$1
PEM_FILE=$2
APP_DIR="/home/ubuntu/social-media-backend"

# Set up SSH command with optional PEM file
if [ -n "$PEM_FILE" ]; then
  SSH_CMD="ssh -i $PEM_FILE"
  SCP_CMD="scp -i $PEM_FILE"
else
  SSH_CMD="ssh"
  SCP_CMD="scp"
fi

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
  env.example

# Upload to EC2
echo "⬆️  Uploading to EC2..."
$SSH_CMD $EC2_HOST "mkdir -p $APP_DIR"
$SCP_CMD deployment.tar.gz $EC2_HOST:$APP_DIR/

# Deploy on EC2
echo "🔧 Installing on EC2..."
$SSH_CMD $EC2_HOST bash -s "$APP_DIR" << 'ENDSSH'
  set -e
  APP_DIR=$1
  cd $APP_DIR
  
  # Check if Node.js is installed
  if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
  
  # Check if pnpm is installed
  if ! command -v pnpm &> /dev/null; then
    echo "📥 Installing pnpm..."
    sudo npm install -g pnpm
  fi
  
  # Check if PM2 is installed
  if ! command -v pm2 &> /dev/null; then
    echo "📥 Installing PM2..."
    sudo npm install -g pm2
  fi
  
  # Extract files
  echo "📂 Extracting deployment package..."
  tar -xzf deployment.tar.gz
  rm deployment.tar.gz
  
  # Setup environment (copy from example if .env doesn't exist)
  if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from env.example"
    cp env.example .env
    echo "⚠️  IMPORTANT: Edit $APP_DIR/.env with your production settings!"
    echo "   - DATABASE_URL"
    echo "   - JWT_SECRET (use a strong random string)"
    echo "   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  fi
  
  # Note about migrations
  echo "📊 Database migrations:"
  echo "   Run the SQL from prisma/migrations/00_initial_schema.sql"
  echo "   in your Supabase SQL Editor if you haven't already."
  
  # Restart PM2
  echo "🚀 Starting application with PM2..."
  pm2 restart social-media-backend 2>/dev/null || pm2 start dist/server.js --name social-media-backend
  pm2 save
  
  # Setup PM2 to start on boot
  sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu || true
  
  echo "✅ Application deployed and running"
  echo "📍 API endpoint: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080/api/v1"
ENDSSH

# Cleanup
rm deployment.tar.gz

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. SSH to EC2 and edit .env file with production settings"
if [ -n "$PEM_FILE" ]; then
  echo "      ssh -i $PEM_FILE $EC2_HOST"
else
  echo "      ssh $EC2_HOST"
fi
echo "   2. Edit /home/ubuntu/social-media-backend/.env"
echo "   3. Restart: pm2 restart social-media-backend"
echo ""
echo "🔍 Useful commands:"
if [ -n "$PEM_FILE" ]; then
  echo "   Check status: ssh -i $PEM_FILE $EC2_HOST 'pm2 status'"
  echo "   View logs: ssh -i $PEM_FILE $EC2_HOST 'pm2 logs social-media-backend'"
  echo "   Monitor: ssh -i $PEM_FILE $EC2_HOST 'pm2 monit'"
else
  echo "   Check status: ssh $EC2_HOST 'pm2 status'"
  echo "   View logs: ssh $EC2_HOST 'pm2 logs social-media-backend'"
  echo "   Monitor: ssh $EC2_HOST 'pm2 monit'"
fi
