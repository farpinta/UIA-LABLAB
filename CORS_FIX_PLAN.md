# CORS Issue Fix Plan

## Problem Analysis

**Error Messages:**
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://localhost:3000/api/analyze. 
(Reason: CORS header 'Access-Control-Allow-Origin' missing). Status code: 204.
```

**Root Causes Identified:**

1. **Status Code 204 (No Content)**: The backend is returning an empty response, which prevents CORS headers from being properly set
2. **Missing CORS Headers**: The preflight OPTIONS request is not being handled correctly
3. **CORS Configuration**: Current setup may not be handling all scenarios

## Current CORS Configuration

**Backend (server.ts):**
```typescript
await fastify.register(cors, {
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});
```

## Solution Steps

### Step 1: Update CORS Configuration
**File:** `apps/backend/src/server.ts`

**Changes Needed:**
- Add `preflightContinue: false` to handle OPTIONS automatically
- Add `optionsSuccessStatus: 204` or `200`
- Add explicit headers configuration
- Consider using wildcard for development: `origin: true`

**Updated Configuration:**
```typescript
await fastify.register(cors, {
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return cb(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Request-Id'],
  preflightContinue: false,
  optionsSuccessStatus: 204
});
```

### Step 2: Add Explicit OPTIONS Handler
**File:** `apps/backend/src/routes/analyze.ts`

**Add before the POST route:**
```typescript
// Handle OPTIONS preflight for /api/analyze
fastify.options('/api/analyze', async (request, reply) => {
  return reply.status(204).send();
});
```

### Step 3: Verify Response Headers
**File:** `apps/backend/src/routes/analyze.ts`

**Ensure all responses include proper status codes:**
- Success: `200` (not 204)
- Error: Appropriate error codes (400, 500, etc.)

**Current issue:** The route might be returning 204 somewhere. Check:
- All `reply.send()` calls have explicit status codes
- No middleware is stripping response bodies

### Step 4: Update Frontend API Client
**File:** `apps/frontend/src/services/apiClient.ts`

**Add better error handling:**
```typescript
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status} from ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error('[API] Response error:', error.message);
    
    if (error.response) {
      console.error('[API] Error response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('[API] No response received - possible CORS issue');
      console.error('[API] Request details:', {
        url: error.config?.url,
        method: error.config?.method
      });
    }
    
    return Promise.reject(error);
  }
);
```

### Step 5: Environment Variables Check
**File:** `apps/backend/.env`

**Verify:**
```env
PORT=3000
HOST=0.0.0.0
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**File:** `apps/frontend/.env`

**Verify:**
```env
VITE_API_BASE_URL=http://localhost:3000
```

### Step 6: Testing Checklist

1. **Start Backend:**
   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd apps/frontend
   npm run dev
   ```

3. **Test Endpoints:**
   - Health check: `curl http://localhost:3000/health`
   - OPTIONS request: `curl -X OPTIONS http://localhost:3000/api/analyze -v`
   - POST request: Test from frontend

4. **Verify Headers:**
   - Check browser Network tab for:
     - `Access-Control-Allow-Origin` header
     - `Access-Control-Allow-Methods` header
     - `Access-Control-Allow-Headers` header

## Alternative Solutions (If Above Fails)

### Option A: Use @fastify/cors with Simpler Config
```typescript
await fastify.register(cors, {
  origin: true, // Allow all origins in development
  credentials: true
});
```

### Option B: Manual CORS Headers
Add a hook to set headers manually:
```typescript
fastify.addHook('onRequest', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', request.headers.origin || '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  reply.header('Access-Control-Allow-Credentials', 'true');
});
```

### Option C: Proxy Configuration (Frontend)
**File:** `apps/frontend/vite.config.ts`

Add proxy to avoid CORS:
```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
```

Then update frontend to use relative URLs:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
```

## Priority Order

1. **Immediate Fix (5 min):** Update CORS config with `origin: true` for development
2. **Proper Fix (15 min):** Implement Step 1-3 with proper origin validation
3. **Fallback (10 min):** Use Vite proxy if CORS continues to fail

## Success Criteria

- ✅ OPTIONS preflight request returns 204 with proper CORS headers
- ✅ POST /api/analyze returns 200 with data and CORS headers
- ✅ Frontend can successfully call backend without CORS errors
- ✅ Browser Network tab shows `Access-Control-Allow-Origin` header in response

## Next Steps

**Switch to 'code' mode to implement the fixes.**
