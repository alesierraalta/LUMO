#!/bin/bash
# Script to switch from buildpack to Dockerfile deployment

echo "🔄 Switching to Dockerfile-based deployment..."

# Backup current choreo.yaml
if [ -f "choreo.yaml" ]; then
    cp choreo.yaml choreo-buildpack-backup.yaml
    echo "✅ Backed up current choreo.yaml"
fi

# Switch to Dockerfile config
if [ -f "choreo-dockerfile.yaml" ]; then
    cp choreo-dockerfile.yaml choreo.yaml
    echo "✅ Switched to Dockerfile configuration"
else
    echo "❌ choreo-dockerfile.yaml not found!"
    exit 1
fi

echo "🎉 Configuration switched successfully!"
echo "📝 Next steps:"
echo "   1. git add choreo.yaml Dockerfile .choreoignore"
echo "   2. git commit -m 'Fix: Switch to Dockerfile build to bypass buildpack cache corruption'"
echo "   3. git push"
echo "   4. Redeploy in Choreo dashboard"
