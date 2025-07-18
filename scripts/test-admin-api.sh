#!/bin/bash

# Test admin API endpoints
echo "🔍 Testing N3RVE Admin API Endpoints..."
echo "======================================="

BASE_URL="https://n3rve-onboarding.com/api"

# Get JWT token (you need to provide a valid token)
# For testing, you can get this from browser DevTools after logging in as admin
TOKEN="YOUR_JWT_TOKEN_HERE"

echo -e "\n1. Testing /admin/users/stats:"
curl -s -X GET "$BASE_URL/admin/users/stats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo -e "\n2. Testing /admin/submissions/stats:"
curl -s -X GET "$BASE_URL/admin/submissions/stats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo -e "\n3. Testing /admin/users:"
curl -s -X GET "$BASE_URL/admin/users?limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .

echo -e "\n4. Testing /admin/submissions:"
curl -s -X GET "$BASE_URL/admin/submissions?limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .