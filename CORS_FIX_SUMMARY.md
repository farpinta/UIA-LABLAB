# CORS and CSP Fix Summary

## Issues Identified

1. **CORS Origin Mismatch**: Backend was configured for `http://localhost:5173` but frontend is served from `https://uia-bobinsight.pinont.me`
2. **Mixed Content**: HTTPS frontend trying to reach HTTP backend through Cloudflare Tunnel
3. **CSP Violation**: Content Security Policy blocking connections with `connect-src 'none'`
4. **Single Origin Limitation**: Backend only accepted one hardcoded origin

## Changes Made

### 1. Backend CORS Configuration ([`apps/backend/src/server.ts`](apps/backend/src/server.ts:22-68))

**Before:**
```typescript
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

await fastify.register(cors, {
  origin: FRONTEND_URL,
  credentials: true,
  // ...
});
```

**After:**
```typescript
// Support multiple frontend origins with wildcard patterns
const FRONTEND_URLS = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

await fastify.register(cors, {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const isAllowed = FRONTEND_URLS.some(allowedOrigin => {
      if (origin === allowedOrigin) return true;
      
      // Pattern match for wildcards (e.g., *.pinont.me)
      const pattern = allowedOrigin.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  // ...
});
```

**Key Improvements:**
- ✅ Supports multiple origins via comma-separated list
- ✅ Wildcard pattern matching for subdomains (`*.pinont.me`)
- ✅ Logs blocked origins for debugging
- ✅ Allows requests with no origin (mobile apps, Postman)

### 2. Docker Compose Environment ([`docker-compose.yml`](docker-compose.yml:16))

**Before:**
```yaml
environment:
  - FRONTEND_URL=http://localhost:5173
  - VITE_API_URL=http://localhost:3000
```

**After:**
```yaml
environment:
  - FRONTEND_URL=${FRONTEND_URL:-http://localhost:5173,https://uia-bobinsight.pinont.me,https://*.pinont.me}
  - VITE_API_BASE_URL=${VITE_API_BASE_URL:-http://localhost:3000}
```

**Key Improvements:**
- ✅ Reads from `.env` file with sensible defaults
- ✅ Includes production domains by default
- ✅ Supports environment variable override

### 3. Nginx Configuration ([`apps/frontend/nginx.conf`](apps/frontend/nginx.conf:13-23))

**Before:**
```nginx
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

**After:**
```nginx
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# CORS headers
add_header Access-Control-Allow-Origin "*" always;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:3000 https://*.pinont.me http://*.pinont.me ws://localhost:* wss://*.pinont.me; frame-ancestors 'self';" always;
```

**Key Improvements:**
- ✅ Stricter referrer policy for security
- ✅ Explicit CORS headers for API requests
- ✅ CSP allows connections to backend domains
- ✅ Supports both HTTP (dev) and HTTPS (prod)
- ✅ WebSocket support for future features

### 4. Environment Configuration ([`.env.example`](.env.example:11-15))

**Added:**
```bash
# Frontend URL (for CORS) - Comma-separated list
# Supports wildcards: https://*.pinont.me
FRONTEND_URL=http://localhost:5173,https://uia-bobinsight.pinont.me,https://*.pinont.me

# Frontend API Base URL (for production deployment)
VITE_API_BASE_URL=http://localhost:3000
```

## Deployment Steps

### Step 1: Update Environment Variables

```bash
# Create .env from example
cp .env.example .env

# Edit .env and set:
FRONTEND_URL=https://uia-bobinsight.pinont.me,https://*.pinont.me
VITE_API_BASE_URL=https://your-backend-tunnel.pinont.me
```

### Step 2: Rebuild Containers

```bash
# Stop existing containers
docker-compose down

# Rebuild with new configuration
docker-compose build --no-cache

# Start services
docker-compose up -d
```

### Step 3: Verify Deployment

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f backend frontend

# Look for this in backend logs:
# "DEBUG: Allowed CORS origins: [...]"
```

### Step 4: Test CORS

```bash
# From browser console on https://uia-bobinsight.pinont.me
fetch('https://your-backend-tunnel.pinont.me/health')
  .then(r => r.json())
  .then(console.log)
```

## Troubleshooting

### Issue: Still seeing CORS errors

**Solution:**
1. Check backend logs: `docker-compose logs backend | grep CORS`
2. Verify environment: `docker-compose exec backend env | grep FRONTEND_URL`
3. Ensure frontend origin matches exactly (including protocol)

### Issue: CSP violations

**Solution:**
1. Check browser console for blocked resource
2. Update CSP `connect-src` in [`nginx.conf`](apps/frontend/nginx.conf:23)
3. Rebuild frontend: `docker-compose up -d --build frontend`

### Issue: Mixed content warnings

**Solution:**
1. Ensure backend is accessible via HTTPS through Cloudflare Tunnel
2. Update `VITE_API_BASE_URL` to use `https://`
3. Rebuild frontend with new env var

## Testing Checklist

- [ ] Backend accepts requests from `https://uia-bobinsight.pinont.me`
- [ ] No CORS errors in browser console
- [ ] No CSP violations in browser console
- [ ] API requests complete successfully
- [ ] Health check endpoint responds: `/health`
- [ ] Analyze endpoint accepts requests: `/api/analyze`

## Security Notes

1. **Wildcard Origins**: The `*.pinont.me` pattern allows any subdomain. For production, consider listing specific subdomains.
2. **HTTPS Only**: Always use HTTPS in production to prevent MITM attacks.
3. **API Keys**: Never commit `.env` files. Use environment variables or secrets management.
4. **Rate Limiting**: Current limit is 10 requests per minute. Adjust in `.env` if needed.

## Additional Resources

- Full deployment guide: [`DEPLOYMENT.md`](DEPLOYMENT.md)
- Backend server code: [`apps/backend/src/server.ts`](apps/backend/src/server.ts)
- Frontend API client: [`apps/frontend/src/services/apiClient.ts`](apps/frontend/src/services/apiClient.ts)
- Nginx configuration: [`apps/frontend/nginx.conf`](apps/frontend/nginx.conf)

---

Made with Bob