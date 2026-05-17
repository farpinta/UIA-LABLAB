# Multi-stage build for optimized production image
FROM node:20-alpine AS base

WORKDIR /app

# Copy workspace configuration
COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/frontend/package*.json ./apps/frontend/

# Install dependencies stage
FROM base AS dependencies

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy source code
COPY packages/shared-types ./packages/shared-types
COPY apps/frontend ./apps/frontend

# Build stage
FROM dependencies AS build

# Build argument for API URL
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

# Build shared types first
WORKDIR /app/packages/shared-types
RUN npm run build

# Build frontend
WORKDIR /app/apps/frontend
RUN npm run build

# Production stage with nginx
FROM nginx:alpine AS production

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy custom nginx configuration
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from build stage
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Made with Bob