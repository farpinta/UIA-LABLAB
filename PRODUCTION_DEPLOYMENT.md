# BobInsight Production Deployment Guide

## Overview
This guide explains how to configure BobInsight to connect to an actual production server instead of localhost.

## Quick Start

### Option 1: Same-Origin Deployment (Recommended)
Deploy both frontend and backend on the same domain (e.g., `yourdomain.com`).

**Configuration:**
```bash
# .env file - Leave VITE_API_BASE_URL unset or empty
VITE_API_BASE_URL=
```

The frontend will automatically use `window.location.origin` to connect to the backend.

**Example:**
- Frontend: `https://yourdomain.com`
- Backend: `https://yourdomain.com/api`

---

### Option 2: Separate API Domain
Deploy backend on a separate subdomain (e.g., `api.yourdomain.com`).

**Configuration:**
```bash
# .env file
VITE_API_BASE_URL=https://api.yourdomain.com
```

**Example:**
- Frontend: `https://yourdomain.com`
- Backend: `https://api.yourdomain.com`

**Important:** Configure CORS on backend:
```bash
FRONTEND_URL=https://yourdomain.com
```

---

### Option 3: Third-Party Backend Service
Use a deployed backend service (Heroku, Railway, Render, etc.).

**Configuration:**
```bash
# .env file
VITE_API_BASE_URL=https://your-app-name.herokuapp.com
```

**Example:**
- Frontend: `https://bobinsight.vercel.app`
- Backend: `https://bobinsight-api.herokuapp.com`

**Important:** Configure CORS on backend:
```bash
FRONTEND_URL=https://bobinsight.vercel.app
```

---

## Platform-Specific Deployment

### Vercel (Frontend)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard:
   ```
   VITE_API_BASE_URL=https://your-backend-url.com
   ```
3. **Deploy** - Vercel will automatically build and deploy

**Build Settings:**
- Framework Preset: `Vite`
- Root Directory: `apps/frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

---

### Heroku (Backend)

1. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set WATSONX_BASE_URL=your_watsonx_url
   heroku config:set IBM_CLOUD_API_KEY=your_api_key
   heroku config:set WATSONX_PROJECT_ID=your_project_id
   heroku config:set FRONTEND_URL=https://your-frontend-url.vercel.app
   heroku config:set NODE_ENV=production
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

---

### Railway (Backend)

1. **Connect repository** to Railway
2. **Set environment variables** in Railway dashboard:
   ```
   WATSONX_BASE_URL=your_watsonx_url
   IBM_CLOUD_API_KEY=your_api_key
   WATSONX_PROJECT_ID=your_project_id
   FRONTEND_URL=https://your-frontend-url.vercel.app
   NODE_ENV=production
   PORT=3000
   ```
3. **Deploy** - Railway will automatically build and deploy

---

### Docker Deployment

**Using docker-compose.yml:**

1. **Create `.env` file:**
   ```bash
   # Backend
   WATSONX_BASE_URL=your_watsonx_url
   IBM_CLOUD_API_KEY=your_api_key
   WATSONX_PROJECT_ID=your_project_id
   FRONTEND_URL=https://your-domain.com
   
   # Frontend
   VITE_API_BASE_URL=https://your-domain.com
   ```

2. **Deploy:**
   ```bash
   docker-compose up -d
   ```

**For production with reverse proxy (nginx):**
```bash
# Frontend connects to backend via same domain
VITE_API_BASE_URL=
```

Configure nginx to route:
- `/` → Frontend (port 5173)
- `/api` → Backend (port 3000)

---

## Environment Variables Reference

### Frontend (.env)
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_BASE_URL` | No | Backend API URL. If empty, uses `window.location.origin` | `https://api.yourdomain.com` |

### Backend (.env)
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `WATSONX_BASE_URL` | Yes | IBM watsonx.ai base URL | `https://us-south.ml.cloud.ibm.com` |
| `IBM_CLOUD_API_KEY` | Yes | IBM Cloud API key | `your_api_key_here` |
| `WATSONX_PROJECT_ID` | Yes | watsonx.ai project ID | `your_project_id_here` |
| `FRONTEND_URL` | Yes | Frontend URL(s) for CORS | `https://yourdomain.com` |
| `PORT` | No | Backend port (default: 3000) | `3000` |
| `NODE_ENV` | No | Environment (default: development) | `production` |

---

## Testing Your Deployment

### 1. Check Backend Health
```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-17T11:42:00.000Z"
}
```

### 2. Test Frontend Connection
Open browser console on your frontend URL and check for:
```
[API] POST /api/analyze
[API] Response 200 from /api/analyze
```

### 3. Verify CORS
If you see CORS errors in browser console:
1. Check `FRONTEND_URL` is set correctly on backend
2. Ensure it matches your actual frontend domain
3. Include protocol (`https://`) in the URL

---

## Common Issues

### Issue: "Network error. Please check your connection"
**Cause:** Frontend cannot reach backend

**Solutions:**
1. Verify `VITE_API_BASE_URL` is set correctly
2. Check backend is running and accessible
3. Test backend health endpoint directly

---

### Issue: CORS Error
**Cause:** Backend rejecting requests from frontend domain

**Solutions:**
1. Set `FRONTEND_URL` on backend to match frontend domain
2. Include protocol in URL: `https://yourdomain.com`
3. For multiple domains, use comma-separated list:
   ```bash
   FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com
   ```

---

### Issue: "Failed to analyze repository"
**Cause:** Backend configuration issue

**Solutions:**
1. Verify IBM watsonx.ai credentials are set
2. Check backend logs for detailed error messages
3. Test backend `/health` endpoint

---

## Security Checklist

- [ ] Never commit `.env` files to git
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS in production
- [ ] Configure CORS to allow only your frontend domain
- [ ] Set `NODE_ENV=production` on backend
- [ ] Use secure API keys with minimal required permissions
- [ ] Implement rate limiting on backend
- [ ] Monitor API usage and costs

---

## Monitoring

### Backend Logs
```bash
# Heroku
heroku logs --tail --app your-app-name

# Railway
railway logs

# Docker
docker logs bobinsight-backend -f
```

### Frontend Errors
Check browser console for:
- Network errors
- API response errors
- CORS issues

---

## Rollback Strategy

If deployment fails:

1. **Revert environment variables** to previous working values
2. **Redeploy previous version:**
   ```bash
   # Heroku
   heroku rollback
   
   # Vercel
   # Use Vercel dashboard to rollback to previous deployment
   ```

3. **Check logs** to identify the issue

---

## Support

For issues or questions:
1. Check backend `/health` endpoint
2. Review browser console for errors
3. Check backend logs for detailed error messages
4. Verify all environment variables are set correctly

---

**Last Updated:** 2026-05-17