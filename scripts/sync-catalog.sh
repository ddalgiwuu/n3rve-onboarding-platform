#!/bin/bash
# NanoClaw → N3RVE Catalog Sync Script
# Usage: ./scripts/sync-catalog.sh [API_URL] [API_KEY]
#
# Defaults to localhost:3001 for local testing.
# For production: ./scripts/sync-catalog.sh https://your-backend-url your-api-key

API_URL="${1:-http://localhost:3001/api}"
API_KEY="${2:-test-key}"
DATA_DIR="/Users/ryan/.nanoclaw/groups/telegram_clo-cron/workspace"

echo "=== N3RVE Catalog Sync ==="
echo "API: $API_URL"
echo "Data: $DATA_DIR"
echo ""

# 1. Sync products (full catalog)
echo "📦 Syncing products..."
CATALOG_FILE="$DATA_DIR/n3rve_full_catalog.json"
if [ -f "$CATALOG_FILE" ]; then
  # Extract products array from full catalog
  PRODUCTS=$(python3 -c "
import json, sys
with open('$CATALOG_FILE') as f:
    data = json.load(f)
print(json.dumps({'products': data['products']}))
")
  RESULT=$(echo "$PRODUCTS" | curl -s -X POST "$API_URL/catalog/sync/products" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d @-)
  echo "  Result: $RESULT"
else
  echo "  ⚠️ File not found: $CATALOG_FILE"
fi

echo ""

# 2. Sync artist identifiers
echo "👤 Syncing artists..."
ARTISTS_FILE="$DATA_DIR/n3rve_artist_identifiers.json"
if [ -f "$ARTISTS_FILE" ]; then
  RESULT=$(cat "$ARTISTS_FILE" | curl -s -X POST "$API_URL/catalog/sync/artists" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d @-)
  echo "  Result: $RESULT"
else
  echo "  ⚠️ File not found: $ARTISTS_FILE"
fi

echo ""

# 3. Check sync status
echo "📊 Sync status..."
STATUS=$(curl -s "$API_URL/catalog/sync/status" -H "x-api-key: $API_KEY")
echo "  $STATUS"

echo ""
echo "=== Done ==="
