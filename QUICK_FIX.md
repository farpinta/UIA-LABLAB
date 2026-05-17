# Quick Fix: Frontend Not Connecting to Production API

## Problem
Frontend is still sending requests to `localhost:3000` instead of `https://uia-bobinsight-api.pinont.me`

## Solution

### Step 1: Verify Frontend Environment Variable
✅ **DONE** - Created `apps/frontend/.env` with:
```bash
VITE_API_BASE_URL=https://uia-bobinsight-api.pinont.me
```

### Step 2: Fix Content Security Policy (CSP)
✅ **DONE** - Updated CSP in:
- `apps/frontend/index.html` (for dev server)
- `apps/frontend/nginx.conf` (for production Docker)

Added `https://uia-bobinsight-api.pinont.me` and `https://*.pinont.me` to allowed `connect-src` domains.

### Step 3: Restart Frontend Dev Server
**IMPORTANT:** You MUST restart the dev server for changes to take effect:

```bash
# Stop the current frontend server (Ctrl+C)
# Then restart it:
npm run dev:frontend
```

Or if running both servers together:
```bash
# Stop all servers (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: If Running Docker
If you're running the Docker production build, you need to rebuild:

```bash
# Stop containers
docker-compose down

# Rebuild frontend with new CSP
docker-compose build frontend

# Start again
docker-compose up -d
```

### Step 3: Verify Backend CORS Configuration
✅ **DONE** - Backend already configured to accept:
- `http://localhost:5173` (development)
- `https://uia-bobinsight.pinont.me` (production frontend)
- `https://*.pinont.me` (wildcard for all subdomains)

### Step 4: Clear Browser Cache
After restarting the server:
1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

Or use Incognito/Private mode to test with a clean slate.

### Step 5: Verify It's Working
Open browser console and check for:
```
[API] POST https://uia-bobinsight-api.pinont.me/api/analyze
```

Instead of:
```
[API] POST http://localhost:3000/api/analyze
```

## Why This Happened

1. **Environment variables in wrong location**: Vite reads `.env` from `apps/frontend/`, not from root
2. **Server not restarted**: Vite caches environment variables on startup
3. **Browser cache**: Old API URL may be cached in browser

## Verification Checklist

- [ ] `apps/frontend/.env` exists with `VITE_API_BASE_URL=https://uia-bobinsight-api.pinont.me`
- [ ] Frontend dev server restarted
- [ ] Browser cache cleared
- [ ] Console shows requests going to `https://uia-bobinsight-api.pinont.me`
- [ ] No CORS errors in console

## Still Not Working?

### Check 1: Environment Variable Loaded
Add this temporarily to `apps/frontend/src/services/apiClient.ts` after line 24:
```typescript
console.log('API_BASE_URL:', API_BASE_URL);
```

You should see:
```
API_BASE_URL: https://uia-bobinsight-api.pinont.me
```

If you see `http://localhost:3000`, the `.env` file is not being read.

### Check 2: Backend is Accessible
Test the backend directly:
```bash
curl https://uia-bobinsight-api.pinont.me/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### Check 3: CORS Headers
Check if backend is sending correct CORS headers:
```bash
curl -H "Origin: https://uia-bobinsight.pinont.me" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://uia-bobinsight-api.pinont.me/api/analyze -v
```

Look for:
```
Access-Control-Allow-Origin: https://uia-bobinsight.pinont.me
```

## Production Deployment

For production builds (not dev server):

1. **Build with environment variable:**
   ```bash
   cd apps/frontend
   VITE_API_BASE_URL=https://uia-bobinsight-api.pinont.me npm run build
   ```

2. **Or set in deployment platform:**
   - Vercel: Add `VITE_API_BASE_URL` in Environment Variables
   - Netlify: Add in Site Settings > Environment Variables
   - Docker: Pass via `docker-compose.yml` or `--env` flag

## Need More Help?

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for complete deployment guide.