# Multi-stage build for Quasar Frontend
# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install *all* dependencies, including dev - `quasar build` (via
# @quasar/app-vite, vite, typescript, vue-tsc, ...) only exists in
# devDependencies, so `npm ci --only=production` here would make (and
# previously did make) this build fail with "quasar: not found".
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application
FROM nginx:alpine AS production

# Copy built files from builder stage
COPY --from=builder /app/dist/spa /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
