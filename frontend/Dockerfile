# Build stage
FROM node:20-slim as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm install @rollup/rollup-linux-x64-gnu --save-optional

# Copy source code
COPY . .

# Build the application
ARG VITE_API_URL
ARG VITE_DROPBOX_CLIENT_ID
ARG VITE_DROPBOX_APP_KEY
ARG VITE_DROPBOX_REDIRECT_URI
ARG VITE_DROPBOX_ACCESS_TOKEN

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DROPBOX_CLIENT_ID=$VITE_DROPBOX_CLIENT_ID
ENV VITE_DROPBOX_APP_KEY=$VITE_DROPBOX_APP_KEY
ENV VITE_DROPBOX_REDIRECT_URI=$VITE_DROPBOX_REDIRECT_URI
ENV VITE_DROPBOX_ACCESS_TOKEN=$VITE_DROPBOX_ACCESS_TOKEN

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Expose ports
EXPOSE 80 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]