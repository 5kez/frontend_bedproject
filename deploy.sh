#!/bin/bash

# Deployment script for Bed Sensor Frontend
# Usage: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
BUILD_DIR="dist/spa"

echo "🚀 Starting deployment to $ENVIRONMENT..."

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found. Please run 'npm run build' first."
    exit 1
fi

case $ENVIRONMENT in
    "staging")
        echo "📦 Deploying to staging..."
        HOST=$STAGING_HOST
        USER=$STAGING_USER
        PATH_TO_DEPLOY=$STAGING_PATH
        ;;
    "production")
        echo "📦 Deploying to production..."
        HOST=$PRODUCTION_HOST
        USER=$PRODUCTION_USER
        PATH_TO_DEPLOY=$PRODUCTION_PATH
        ;;
    *)
        echo "❌ Invalid environment. Use 'staging' or 'production'"
        exit 1
        ;;
esac

# Validate required variables
if [ -z "$HOST" ] || [ -z "$USER" ] || [ -z "$PATH_TO_DEPLOY" ]; then
    echo "❌ Missing deployment configuration for $ENVIRONMENT"
    echo "Please set HOST, USER, and PATH_TO_DEPLOY variables"
    exit 1
fi

echo "🔄 Syncing files to $USER@$HOST:$PATH_TO_DEPLOY..."

# Sync files using rsync
rsync -avz --delete \
    --exclude='.git*' \
    --exclude='node_modules' \
    --exclude='*.log' \
    "$BUILD_DIR/" "$USER@$HOST:$PATH_TO_DEPLOY"

echo "✅ Deployment to $ENVIRONMENT completed successfully!"
echo "🌐 Your application should be available at: https://$HOST"
