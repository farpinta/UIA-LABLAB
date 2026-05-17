# BobInsight Docker Setup Guide

This guide explains how to run BobInsight using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose 2.0+ installed
- At least 4GB of available RAM
- IBM Cloud API credentials (for watsonx.ai integration)

## Quick Start

### 1. Environment Setup

Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your IBM Cloud credentials:

```env
IBM_CLOUD_API_KEY=your_actual_api_key_here
WATSONX_PROJECT_ID=your_actual_project_id_here
```

### 2. Production Deployment

Build and start all services in production mode:

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service health
docker-compose ps
```

Access the application:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health

### 3. Development Mode

For development with hot-reload:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Rebuild after dependency changes
docker-compose -f docker-compose.dev.yml up -d --build
```

Development mode features:
- ✅ Hot-reload for both frontend and backend
- ✅ Source code mounted as volumes
- ✅ Full TypeScript watch mode
- ✅ Faster iteration cycles

## Service Architecture

```
┌─────────────────┐
│   Frontend      │  Port 5173 (dev) / 80 (prod)
│   React + Vite  │  Nginx in production
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend       │  Port 3000
│   Fastify + TS  │  Node.js runtime
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Redis Cache   │  Port 6379 (optional)
│   (Optional)    │  For production caching
└─────────────────┘
```

## Docker Commands Reference

### Basic Operations

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a specific service
docker-compose restart backend

# View logs for a specific service
docker-compose logs -f frontend

# Execute command in running container
docker-compose exec backend sh
docker-compose exec frontend sh
```

### Build & Rebuild

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build backend

# Force rebuild without cache
docker-compose build --no-cache

# Pull latest base images
docker-compose pull
```

### Cleanup

```bash
# Stop and remove containers, networks
docker-compose down

# Remove volumes as well
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a --volumes
```

### Debugging

```bash
# Check service status
docker-compose ps

# View resource usage
docker stats

# Inspect a container
docker inspect bobinsight-backend

# View container logs with timestamps
docker-compose logs -f --timestamps backend

# Follow logs from all services
docker-compose logs -f
```

## Volume Management

The setup uses Docker volumes for persistent data:

| Volume | Purpose | Service |
|--------|---------|---------|
| `backend-temp` | Temporary git clones | Backend |
| `backend-cache` | API response cache | Backend |
| `redis-data` | Redis persistence | Redis |

### Volume Operations

```bash
# List volumes
docker volume ls

# Inspect a volume
docker volume inspect bobinsight_backend-cache

# Remove unused volumes
docker volume prune

# Backup a volume
docker run --rm -v bobinsight_backend-cache:/data -v $(pwd):/backup alpine tar czf /backup/cache-backup.tar.gz /data
```

## Environment Variables

### Backend Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Runtime environment |
| `PORT` | `3000` | Backend server port |
| `HOST` | `0.0.0.0` | Bind address |
| `FRONTEND_URL` | `http://localhost:5173` | CORS origin |
| `IBM_CLOUD_API_KEY` | - | IBM Cloud API key (required) |
| `WATSONX_PROJECT_ID` | - | watsonx.ai project ID (required) |
| `WATSONX_BASE_URL` | `https://us-south.ml.cloud.ibm.com` | watsonx.ai endpoint |
| `CACHE_TTL` | `3600` | Cache time-to-live (seconds) |
| `TEMP_DIR` | `/tmp/bobinsight` | Temporary directory for git clones |
| `RATE_LIMIT_MAX` | `10` | Max requests per window |
| `RATE_LIMIT_WINDOW` | `60000` | Rate limit window (ms) |

### Frontend Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3000` | Backend API URL |

## Health Checks

All services include health checks:

### Backend Health Check
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok"}
```

### Frontend Health Check
```bash
curl http://localhost:5173/health
# Expected: healthy
```

### Redis Health Check
```bash
docker-compose exec redis redis-cli ping
# Expected: PONG
```

## Troubleshooting

### Issue: Services won't start

**Solution:**
```bash
# Check logs
docker-compose logs

# Verify environment variables
docker-compose config

# Check port conflicts
netstat -tuln | grep -E '3000|5173|6379'
```

### Issue: Backend can't connect to IBM API

**Solution:**
1. Verify `.env` file has correct credentials
2. Check API key validity
3. Review backend logs: `docker-compose logs backend`
4. Test API manually: `curl -H "Authorization: Bearer $IBM_CLOUD_API_KEY" $WATSONX_BASE_URL`

### Issue: Frontend can't reach backend

**Solution:**
1. Ensure backend is healthy: `curl http://localhost:3000/health`
2. Check CORS configuration in backend
3. Verify `VITE_API_URL` in frontend build
4. Rebuild frontend: `docker-compose build frontend`

### Issue: Out of disk space

**Solution:**
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup
docker system prune -a --volumes
```

### Issue: Hot-reload not working in dev mode

**Solution:**
1. Ensure volumes are correctly mounted
2. Check file permissions
3. Restart the service: `docker-compose -f docker-compose.dev.yml restart frontend`

## Performance Optimization

### Production Optimizations

1. **Multi-stage builds:** Reduces final image size by 60-70%
2. **Layer caching:** Optimized `COPY` order for faster rebuilds
3. **Alpine base images:** Minimal footprint (~50MB vs ~900MB)
4. **Nginx for frontend:** Efficient static file serving
5. **Health checks:** Automatic service recovery

### Resource Limits (Optional)

Add to `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build images
        run: docker-compose build
      - name: Run tests
        run: docker-compose run backend npm test
```

## Security Best Practices

1. ✅ Never commit `.env` file
2. ✅ Use secrets management in production
3. ✅ Run containers as non-root user (implemented)
4. ✅ Scan images for vulnerabilities: `docker scan bobinsight-backend`
5. ✅ Keep base images updated
6. ✅ Use `.dockerignore` to exclude sensitive files

## Monitoring & Logging

### Centralized Logging

```bash
# Export logs to file
docker-compose logs > bobinsight.log

# Stream logs to external service
docker-compose logs -f | your-log-aggregator
```

### Resource Monitoring

```bash
# Real-time stats
docker stats

# Export metrics
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## Production Deployment Checklist

- [ ] Configure production environment variables
- [ ] Set up SSL/TLS certificates (use reverse proxy like Traefik/Nginx)
- [ ] Enable Redis for production caching
- [ ] Configure log aggregation (e.g., ELK stack)
- [ ] Set up monitoring (e.g., Prometheus + Grafana)
- [ ] Implement backup strategy for volumes
- [ ] Configure firewall rules
- [ ] Set resource limits
- [ ] Enable automatic restarts
- [ ] Test health checks
- [ ] Document rollback procedure

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review this documentation
- Check GitHub issues
- Contact the BobInsight team

---

**Last Updated:** 2026-05-17  
**Docker Version:** 20.10+  
**Docker Compose Version:** 2.0+