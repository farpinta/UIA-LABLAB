# BobInsight Deployment Guide

## CORS and CSP Configuration for Production

This guide explains how to configure BobInsight for deployment with Cloudflare Tunnel or similar reverse proxy setups.

## Environment Variables

### Backend (.env)

```bash
# IBM watsonx.ai Config
WATSONX_BASE_URL=https://base-url-of-your-watsonx-ai-service
IBM_CLOUD_API_KEY=your_ibm_cloud_api_key_here
WATSONX_PROJECT_ID=your_watsonx_project_id_here

# Backend Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Frontend URL (for CORS) - Comma-separated list
# Supports wildcards: https://*.pinont.me
FRONTEND_URL=http://localhost:5173,https://uia-bobinsight.pinont.me,https://*.pinont.me

# Cache Configuration
CACHE_TTL=3600
TEMP_DIR=/tmp/bobinsight

# Rate Limiting
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW=60000
```

### Frontend Build Args

```bash
# API Base URL - Should point to your backend through Cloudflare Tunnel
VITE_API_BASE_URL=https://your-backend-domain.pinont.me
```

## Docker Compose Deployment

### 1. Update your `.env` file

```bash
cp .env.example .env
# Edit .env with your production values
```

### 2. Set Frontend URL for CORS

```bash
# In .env file
FRONTEND_URL=https://uia-bobinsight.pinont.me,https://*.pinont.me
```

### 3. Set API Base URL for Frontend

```bash
# In .env file
VITE_API_BASE_URL=https://your-backend-tunnel.pinont.me
```

### 4. Rebuild and Deploy

```bash
# Stop existing containers
docker-compose down

# Rebuild with new environment variables
docker-compose build --no-cache

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

## Cloudflare Tunnel Configuration

### Backend Tunnel

Your Cloudflare Tunnel should expose the backend service:

```yaml
# cloudflared config.yml
tunnel: your-tunnel-id
credentials-file: /path/to/credentials.json

ingress:
  - hostname: your-backend-tunnel.pinont.me
    service: http://localhost:3000
  - service: http_status:404
```

### Frontend Tunnel

Your Cloudflare Tunnel should expose the frontend service:

```yaml
# cloudflared config.yml
tunnel: your-tunnel-id
credentials-file: /path/to/credentials.json

ingress:
  - hostname: uia-bobinsight.pinont.me
    service: http://localhost:5173
  - service: http_status:404
```

## Troubleshooting

### CORS Errors

If you see CORS errors in the browser console:

1. **Check Backend Logs**
   ```bash
   docker-compose logs backend | grep CORS
   ```
   
2. **Verify FRONTEND_URL**
   ```bash
   docker-compose exec backend env | grep FRONTEND_URL
   ```

3. **Check Allowed Origins**
   The backend logs should show: `DEBUG: Allowed CORS origins: [...]`

### CSP Violations

If you see Content Security Policy violations:

1. **Check nginx.conf** - Ensure `connect-src` includes your backend domain
2. **Update CSP Header** in [`apps/frontend/nginx.conf`](apps/frontend/nginx.conf:23)

### Mixed Content Warnings

If frontend (HTTPS) cannot reach backend (HTTP):

1. **Use HTTPS for Backend** - Configure Cloudflare Tunnel with HTTPS
2. **Update VITE_API_BASE_URL** to use `https://` instead of `http://`

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use specific origins** - Avoid wildcards in production if possible
3. **Enable HTTPS** - Always use HTTPS in production
4. **Rotate API Keys** - Regularly rotate IBM Cloud API keys
5. **Monitor Logs** - Check for unauthorized access attempts

## Quick Fix Commands

### Rebuild Backend Only
```bash
docker-compose up -d --build --no-deps backend
```

### Rebuild Frontend Only
```bash
docker-compose up -d --build --no-deps frontend
```

### View Real-time Logs
```bash
docker-compose logs -f backend frontend
```

### Check Container Health
```bash
docker-compose ps
```

## Production Checklist

- [ ] `.env` file created with production values
- [ ] `FRONTEND_URL` includes all production domains
- [ ] `VITE_API_BASE_URL` points to backend tunnel
- [ ] Cloudflare Tunnel configured for both services
- [ ] HTTPS enabled on both frontend and backend
- [ ] API keys rotated and secured
- [ ] Rate limiting configured appropriately
- [ ] Monitoring and logging enabled
- [ ] Health checks passing

---

Made with Bob