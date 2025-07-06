#!/bin/bash

# Check backend logs and status
echo "=== Backend Container Status ==="
docker ps -a | grep n3rve-backend

echo -e "\n=== Backend Logs (last 50 lines) ==="
docker logs n3rve-backend --tail 50 2>&1

echo -e "\n=== MongoDB Status ==="
docker ps -a | grep n3rve-mongodb

echo -e "\n=== MongoDB Logs (last 20 lines) ==="
docker logs n3rve-mongodb --tail 20 2>&1

echo -e "\n=== Environment Check ==="
docker exec n3rve-backend printenv | grep -E "(NODE_ENV|MONGODB_URI|PORT)" | sed 's/=.*/=***/'

echo -e "\n=== Network Connectivity ==="
docker exec n3rve-backend ping -c 1 mongodb || echo "Cannot ping mongodb"