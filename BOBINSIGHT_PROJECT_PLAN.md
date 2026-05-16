# BobInsight - Complete Project Initialization Plan

## Executive Summary

**Project:** BobInsight - Interactive Function Flow Mapper  
**Timeline:** 72-Hour Hackathon (IBM Bob Hackathon 2026)  
**Architecture:** 3-Tier Monorepo (Frontend / Backend / AI Integration)  
**Status:** Planning Phase → Ready for Implementation

---

## 1. Project Architecture Overview

### High-Level Flow
```
User Input (GitHub URL) 
  ↓
Frontend (React + Vite)
  ↓
Backend API (Fastify + TypeScript)
  ↓
Git Clone Service (simple-git)
  ↓
IBM Bob API Integration (with Fallback)
  ↓
Graph Transformer Service
  ↓
Frontend Visualization (React Flow)
```

### Monorepo Structure
```
/bobinsight-monorepo/
├── package.json                    # Workspace root
├── .env.example                    # Environment template
├── .gitignore
├── README.md
├── turbo.json                      # Turborepo config (optional)
│
├── /apps/
│   ├── /frontend/                  # React + Vite + React Flow
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── index.html
│   │   └── /src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── /components/
│   │       │   ├── RepoInput.tsx
│   │       │   ├── GraphVisualization.tsx
│   │       │   ├── FunctionInspector.tsx
│   │       │   └── LoadingState.tsx
│   │       ├── /hooks/
│   │       │   └── useGraphData.ts
│   │       ├── /services/
│   │       │   └── apiClient.ts
│   │       └── /types/
│   │           └── index.ts
│   │
│   └── /backend/                   # Fastify + TypeScript
│       ├── package.json
│       ├── tsconfig.json
│       ├── .env
│       └── /src/
│           ├── server.ts           # Entry point
│           ├── /routes/
│           │   ├── health.ts
│           │   └── analyze.ts
│           ├── /services/
│           │   ├── gitService.ts
│           │   ├── bobApiService.ts
│           │   ├── graphTransformer.ts
│           │   └── cacheService.ts
│           ├── /utils/
│           │   ├── urlValidator.ts
│           │   ├── errorHandler.ts
│           │   └── logger.ts
│           ├── /mocks/
│           │   └── expressAppMock.json
│           └── /types/
│               └── index.ts
│
└── /packages/
    └── /shared-types/              # Shared TypeScript interfaces
        ├── package.json
        ├── tsconfig.json
        └── /src/
            └── index.ts
```

---

## 2. Technology Stack Breakdown

### Frontend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18+ | UI Framework |
| TypeScript | 5.x | Type Safety |
| Vite | 5.x | Build Tool |
| React Flow | 11.x | Graph Visualization |
| Tailwind CSS | 3.x | Styling |
| Axios | 1.x | HTTP Client |
| Zustand | 4.x | State Management |

### Backend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20+ LTS | Runtime |
| Fastify | 4.x | Web Framework |
| TypeScript | 5.x | Type Safety |
| simple-git | 3.x | Git Operations |
| dotenv | 16.x | Environment Variables |
| node-cache | 5.x | In-Memory Caching |
| axios | 1.x | HTTP Client |
| axios-retry | 4.x | Retry Logic |
| bottleneck | 2.x | Rate Limiting |

### DevOps & Monitoring
| Tool | Purpose |
|------|---------|
| Vercel/Netlify | Frontend Deployment |
| Heroku/Railway | Backend Deployment |
| Sentry | Error Monitoring |
| GitHub Actions | CI/CD Pipeline |

---

## 3. Data Contract Schema

### TypeScript Interfaces (`/packages/shared-types/src/index.ts`)

```typescript
export interface GraphNode {
  id: string;
  fileName: string;
  functions: string[];
}

export interface GraphEdge {
  id: string;
  sourceFile: string;
  sourceFunction: string;
  targetFile: string;
  targetFunction: string;
  description: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AnalyzeRequest {
  repoUrl: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data?: GraphData;
  error?: string;
  source: 'ibm-bob' | 'fallback-mock' | 'fallback-cache' | 'fallback-ast';
}
```

### API Endpoints

#### POST `/api/analyze`
**Request:**
```json
{
  "repoUrl": "https://github.com/username/repo"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "f1",
        "fileName": "src/auth.js",
        "functions": ["login", "verify"]
      }
    ],
    "edges": [
      {
        "id": "e1",
        "sourceFile": "src/auth.js",
        "sourceFunction": "login",
        "targetFile": "src/db.js",
        "targetFunction": "getUser",
        "description": "Validates user credentials"
      }
    ]
  },
  "source": "ibm-bob"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid GitHub URL format",
  "source": "fallback-mock"
}
```

#### GET `/health`
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-16T15:30:00.000Z",
  "services": {
    "api": "healthy",
    "cache": "healthy"
  }
}
```

---

## 4. IBM Bob API Integration Strategy

### Request Flow
1. **Frontend** → POST `/api/analyze` with `{ repoUrl }`
2. **Backend** → Validate & sanitize URL
3. **Backend** → Clone repo using `simple-git`
4. **Backend** → Extract file contents
5. **Backend** → Send to IBM Bob API with prompt
6. **Backend** → Transform response to Data Contract
7. **Backend** → Return to Frontend
8. **Frontend** → Render with React Flow

### Prompt Template for IBM Bob
```
Analyze this repository and extract:
1. All function declarations (name, file, line number)
2. Cross-file function invocations (which function calls which)
3. Return strictly as JSON: 
{
  "files": [
    {
      "name": "src/auth.js",
      "functions": [
        {
          "name": "login",
          "calls": [
            {
              "file": "src/db.js",
              "function": "getUser",
              "description": "Fetches user record"
            }
          ]
        }
      ]
    }
  ]
}
```

### Fallback Mechanism (3-Tier)

| Priority | Trigger | Action | Implementation |
|----------|---------|--------|----------------|
| **Fallback A** | API key missing OR API unreachable | Serve hardcoded mock JSON | `expressAppMock.json` |
| **Fallback B** | Response time > 15s | Serve pre-cached analysis | Cache service with 3 demo repos |
| **Fallback C** | Success rate < 80% | Use local AST parser | `@babel/parser` as supplement |

### Mock Data (`/apps/backend/src/mocks/expressAppMock.json`)
```json
{
  "nodes": [
    { "id": "f1", "fileName": "src/auth.js", "functions": ["login", "verify"] },
    { "id": "f2", "fileName": "src/db.js", "functions": ["getUser", "saveSession"] },
    { "id": "f3", "fileName": "src/router.js", "functions": ["initRoutes"] }
  ],
  "edges": [
    {
      "id": "e1",
      "sourceFile": "src/auth.js",
      "sourceFunction": "login",
      "targetFile": "src/db.js",
      "targetFunction": "getUser",
      "description": "Fetches user record for credential validation"
    },
    {
      "id": "e2",
      "sourceFile": "src/auth.js",
      "sourceFunction": "verify",
      "targetFile": "src/db.js",
      "targetFunction": "saveSession",
      "description": "Persists verified session token"
    },
    {
      "id": "e3",
      "sourceFile": "src/router.js",
      "sourceFunction": "initRoutes",
      "targetFile": "src/auth.js",
      "targetFunction": "login",
      "description": "Mounts login handler on POST /login"
    }
  ]
}
```

---

## 5. Security Implementation (DevSecOps)

### URL Sanitization (`/apps/backend/src/utils/urlValidator.ts`)
```typescript
export function validateGitHubUrl(url: string): boolean {
  const githubPattern = /^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/;
  return githubPattern.test(url);
}

export function sanitizeUrl(url: string): string {
  // Remove any shell metacharacters
  return url.replace(/[;&|`$()]/g, '');
}
```

### Security Checklist
- ✅ **URL Validation:** Reject non-GitHub URLs
- ✅ **No Shell Injection:** Use `simple-git` API, never `exec()`
- ✅ **Secret Management:** Load from `.env`, never log credentials
- ✅ **Temp Cleanup:** Delete cloned repos after analysis
- ✅ **Rate Limiting:** Max 10 requests/minute per IP
- ✅ **CORS:** Whitelist frontend origin only
- ✅ **Input Validation:** Validate all request bodies with schemas

### Rate Limiting Strategy
```typescript
import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 6000 // 10 requests per minute
});
```

---

## 6. Frontend Architecture

### Component Hierarchy
```
App.tsx
├── RepoInput.tsx           # GitHub URL input form
├── LoadingState.tsx        # Loading spinner & progress
├── ErrorBoundary.tsx       # Error handling wrapper
└── GraphVisualization.tsx  # React Flow container
    ├── CustomNode.tsx      # File node with function list
    ├── CustomEdge.tsx      # Function call edge
    └── FunctionInspector.tsx # Side panel for details
```

### State Management (Zustand)
```typescript
interface GraphStore {
  graphData: GraphData | null;
  loading: boolean;
  error: string | null;
  selectedNode: GraphNode | null;
  setGraphData: (data: GraphData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectNode: (node: GraphNode | null) => void;
}
```

### React Flow Configuration
- **Layout Algorithm:** Dagre (hierarchical)
- **Node Types:** Custom file nodes with function badges
- **Edge Types:** Bezier curves with labels
- **Controls:** Zoom, pan, fit view, export PNG
- **Minimap:** Bottom-right corner

---

## 7. Backend Architecture

### Service Layer Design

#### `gitService.ts`
```typescript
export async function cloneRepository(repoUrl: string): Promise<string> {
  // Clone to /tmp/<hash>
  // Return local path
}

export async function extractFiles(repoPath: string): Promise<FileContent[]> {
  // Read all .js, .ts, .py files
  // Return file contents
}

export async function cleanup(repoPath: string): Promise<void> {
  // Delete cloned repo
}
```

#### `bobApiService.ts`
```typescript
export async function analyzeRepository(
  files: FileContent[]
): Promise<BobApiResponse> {
  // Send to IBM Bob API
  // Handle retries (3 attempts)
  // Timeout after 15s
  // Return raw response
}
```

#### `graphTransformer.ts`
```typescript
export function transformToGraphData(
  bobResponse: BobApiResponse
): GraphData {
  // Convert Bob API format to Data Contract
  // Generate unique IDs
  // Return { nodes, edges }
}
```

#### `cacheService.ts`
```typescript
export function getCachedAnalysis(repoUrl: string): GraphData | null {
  // Check cache
  // Return if exists
}

export function setCachedAnalysis(repoUrl: string, data: GraphData): void {
  // Store in cache (TTL: 1 hour)
}
```

### Error Handling Strategy
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

// Usage
throw new AppError(400, 'Invalid GitHub URL', true);
```

---

## 8. Environment Configuration

### `.env.example`
```env
# IBM Bob API Configuration
IBM_BOB_API_KEY=your_api_key_here
IBM_BOB_BASE_URL=https://api.ibm-bob.com

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Cache Configuration
CACHE_TTL=3600

# Rate Limiting
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW=60000
```

---

## 9. Implementation Roadmap

### Phase 1: Project Initialization (30 minutes)
- [x] Create monorepo structure
- [ ] Setup npm workspaces
- [ ] Initialize frontend (Vite + React + Tailwind)
- [ ] Initialize backend (Fastify + TypeScript)
- [ ] Create shared-types package
- [ ] Setup .env files
- [ ] Create mock JSON file

### Phase 2: Backend Core (4 hours)
- [ ] Implement URL validator
- [ ] Implement git service (clone, extract, cleanup)
- [ ] Implement Bob API service (with retry logic)
- [ ] Implement graph transformer
- [ ] Implement cache service
- [ ] Create `/health` endpoint
- [ ] Create `/api/analyze` endpoint
- [ ] Add error handling middleware
- [ ] Add rate limiting

### Phase 3: Frontend Core (4 hours)
- [ ] Create RepoInput component
- [ ] Setup Axios client
- [ ] Implement useGraphData hook
- [ ] Create LoadingState component
- [ ] Create ErrorBoundary component
- [ ] Setup React Flow
- [ ] Create custom node component
- [ ] Create custom edge component
- [ ] Implement graph layout algorithm

### Phase 4: Integration & Testing (2 hours)
- [ ] Connect frontend to backend
- [ ] Test with mock data
- [ ] Test with real GitHub repos
- [ ] Test fallback mechanisms
- [ ] Test error scenarios
- [ ] Performance optimization

### Phase 5: Polish & Deploy (2 hours)
- [ ] Add loading animations
- [ ] Add function inspector panel
- [ ] Add export functionality
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Railway
- [ ] Setup monitoring (Sentry)
- [ ] Create demo video

---

## 10. Testing Strategy

### Unit Tests
- URL validator
- Graph transformer
- Cache service

### Integration Tests
- `/api/analyze` endpoint
- Git clone service
- Bob API service

### E2E Tests
- Full flow: URL input → graph display
- Fallback mechanism
- Error handling

### Test Repos
1. **Simple:** Express.js hello world (5 files)
2. **Medium:** React Todo App (20 files)
3. **Complex:** Next.js E-commerce (50+ files)

---

## 11. Deployment Configuration

### Frontend (Vercel)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### Backend (Railway)
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

## 12. Success Criteria

### MVP Requirements
- ✅ User can input GitHub URL
- ✅ System clones and analyzes repo
- ✅ Graph displays function-to-function calls
- ✅ Fallback works when API unavailable
- ✅ No security vulnerabilities
- ✅ Deployed and accessible online

### Stretch Goals
- Export graph as PNG/SVG
- Search/filter functions
- Zoom to specific function
- Dark mode
- Multiple repo comparison

---

## 13. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| IBM Bob API unavailable | High | 3-tier fallback mechanism |
| Large repos timeout | Medium | Implement streaming analysis |
| Git clone fails | Medium | Retry logic + error messages |
| Memory issues | Low | Cleanup temp files aggressively |
| Rate limiting hit | Low | Cache + queue system |

---

## 14. Next Steps

1. **Review this plan** with the team
2. **Switch to code mode** to begin implementation
3. **Start with Phase 1** (Project Initialization)
4. **Commit after each phase** for rollback safety
5. **Test continuously** as features are built

---

## 15. Quick Reference Commands

### Development
```bash
# Install dependencies
npm install

# Start frontend dev server
npm run dev --workspace=apps/frontend

# Start backend dev server
npm run dev --workspace=apps/backend

# Build all packages
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Deployment
```bash
# Deploy frontend
vercel --prod

# Deploy backend
railway up
```

---

**Status:** ✅ Planning Complete - Ready for Implementation  
**Next Action:** Switch to `code` mode and execute Phase 1
