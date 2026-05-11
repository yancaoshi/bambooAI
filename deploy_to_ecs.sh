#!/bin/bash

# --- CONFIGURATION (FILL THESE IN) ---
SERVER_USER="your_user"
SERVER_IP="your_server_ip"
DEPLOY_DIR="/var/www/study"
# -------------------------------------

echo "🚀 Starting deployment to $SERVER_IP..."

# 1. Build frontend locally
echo "📦 Building frontend..."
npm run build

# 2. Create a deployment package (excluding node_modules and junk)
echo "📁 Packaging files..."
tar -czf deploy_pkg.tar.gz dist server package.json package-lock.json

# 3. Upload to ECS
echo "📤 Uploading to server..."
scp deploy_pkg.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# 4. Extract and Restart on Server
echo "⚙️  Updating server..."
ssh $SERVER_USER@$SERVER_IP << EOF
  mkdir -p $DEPLOY_DIR
  tar -xzf /tmp/deploy_pkg.tar.gz -C $DEPLOY_DIR
  cd $DEPLOY_DIR
  
  # Install production dependencies if needed
  if [ ! -d "node_modules" ]; then
    npm install --production
  else
    # Update dependencies if package.json changed
    npm install --production
  fi

  # Restart with PM2 (assumes PM2 is installed)
  pm2 delete word-master || true
  DB_PATH=/mnt/data/study pm2 start server/index.js --name "word-master"
  
  rm /tmp/deploy_pkg.tar.gz
  echo "✅ Server updated successfully!"
EOF

# 5. Cleanup local package
rm deploy_pkg.tar.gz
echo "🎉 Deployment complete!"
