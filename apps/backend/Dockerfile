# Multi-stage build for optimized production image
FROM node:20-alpine AS base

# Install git for simple-git dependency
RUN apk add --no-cache git

WORKDIR /app

# Copy workspace configuration
COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/backend/package*.json ./apps/backend/

# Install dependencies stage
FROM base AS dependencies

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy source code
COPY packages/shared-types ./packages/shared-types
COPY apps/backend ./apps/backend

# Build stage
FROM dependencies AS build

# Build shared types first
WORKDIR /app/packages/shared-types
RUN npm run build

# Build backend
WORKDIR /app/apps/backend
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install git and wget for healthcheck
RUN apk add --no-cache git wget

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/backend/package*.json ./apps/backend/

# Install only production dependencies
RUN npm ci --omit=dev --workspace=apps/backend --workspace=packages/shared-types

# Copy built artifacts
COPY --from=build /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=build /app/apps/backend/dist ./apps/backend/dist

# Copy mock data
COPY apps/backend/src/mocks ./apps/backend/src/mocks

# Create temp directory for git operations
RUN mkdir -p /tmp/bobinsight && chmod 777 /tmp/bobinsight

# Set working directory to backend
WORKDIR /app/apps/backend

# Expose backend port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/apps/backend/src/server.js"]

# Made with Bob
