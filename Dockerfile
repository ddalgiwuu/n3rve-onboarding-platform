# Multi-stage Dockerfile for N3RVE Platform

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend files
COPY frontend/package*.json ./
# Install with force to ensure rollup dependencies are properly installed
RUN npm install --force

COPY frontend/ ./
# Install rollup dependencies manually before build
RUN npm install @rollup/rollup-linux-x64-musl --force || true
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend files
COPY backend/package*.json ./
# Copy prisma schema before npm ci to avoid postinstall error
COPY backend/prisma ./prisma
RUN npm ci

COPY backend/ ./
RUN npm run build

# Stage 3: Production Image
FROM node:20-alpine

# Install nginx and supervisor
RUN apk add --no-cache nginx supervisor

# Create app directory
WORKDIR /app

# Copy backend build and dependencies
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default-nossl.conf /etc/nginx/conf.d/default.conf

# Create supervisord config
RUN mkdir -p /etc/supervisor.d
COPY <<EOF /etc/supervisor.d/supervisord.ini
[supervisord]
nodaemon=true
user=root

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:backend]
command=node /app/backend/dist/main.js
directory=/app/backend
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
environment=NODE_ENV="production"
EOF

# Create directories
RUN mkdir -p /app/backend/logs /app/backend/uploads

# Expose ports
EXPOSE 80 443 3001

# Start supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor.d/supervisord.ini"]