# BobInsight - Interactive Function Flow Mapper

> Built for IBM Bob Hackathon 2026

BobInsight is a developer tool that analyzes GitHub repositories and visualizes function-level dependencies as an interactive graph. It uses the IBM Bob API to understand code structure and presents it through an intuitive React Flow interface.

## 🚀 Features

- **GitHub Repository Analysis**: Clone and analyze any public GitHub repository
- **Interactive Graph Visualization**: Explore function-to-function dependencies with React Flow
- **Multi-Tier Fallback System**: Ensures the graph always renders, even if the API is unavailable
- **Real-time Inspection**: Click nodes and edges to see detailed information
- **Secure by Design**: URL sanitization, rate limiting, and no arbitrary code execution
- **Modern Tech Stack**: React 18, TypeScript, Fastify, Tailwind CSS

## 📁 Project Structure

```
bobinsight-monorepo/
├── apps/
│   ├── frontend/          # React + Vite + React Flow
│   └── backend/           # Fastify + TypeScript API
├── packages/
│   └── shared-types/      # Shared TypeScript interfaces
├── package.json           # Workspace root
└── .env.example          # Environment template
```

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- React Flow (graph visualization)
- Tailwind CSS (styling)
- Zustand (state management)
- Axios (HTTP client)

### Backend
- Node.js 20+
- Fastify (web framework)
- TypeScript
- simple-git (Git operations)
- node-cache (caching)
- axios + axios-retry (API client)
- bottleneck (rate limiting)

## 📋 Prerequisites

- Node.js 20+ and npm 10+
- Git
- IBM Bob API key (optional - fallback works without it)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd bobinsight-monorepo
```

### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (frontend, backend, shared-types).

### 3. Configure Environment

```bash
cp .env.example apps/backend/.env
```

Edit `apps/backend/.env` and add your IBM Bob API credentials:

```env
IBM_BOB_API_KEY=your_api_key_here
IBM_BOB_BASE_URL=https://api.ibm-bob.com
```

**Note:** If you don't have an API key, the system will automatically use mock fallback data.

### 4. Build Shared Types

```bash
npm run build --workspace=packages/shared-types
```

### 5. Start Development Servers

**Option A: Start both servers concurrently**
```bash
npm run dev
```

**Option B: Start servers separately**

Terminal 1 (Backend):
```bash
npm run dev:backend
```

Terminal 2 (Frontend):
```bash
npm run dev:frontend
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only

# Build
npm run build            # Build all packages
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Testing
npm test                 # Run tests in all workspaces

# Linting
npm run lint             # Lint all workspaces

# Clean
npm run clean            # Remove all node_modules and build artifacts
```

### Project Commands

```bash
# Install a dependency in a specific workspace
npm install <package> --workspace=apps/frontend
npm install <package> --workspace=apps/backend

# Run a script in a specific workspace
npm run <script> --workspace=apps/frontend
```

## 📡 API Endpoints

### Backend API

#### `GET /health`
Health check endpoint

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

#### `POST /api/analyze`
Analyze a GitHub repository

**Request:**
```json
{
  "repoUrl": "https://github.com/username/repository"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [...],
    "edges": [...]
  },
  "source": "ibm-bob",
  "timestamp": "2026-05-16T15:30:00.000Z"
}
```

## 🔒 Security Features

- **URL Validation**: Only accepts valid GitHub URLs
- **No Shell Injection**: Uses `simple-git` API, never `exec()`
- **Secret Management**: Credentials loaded from `.env`, never logged
- **Rate Limiting**: Max 10 requests per minute per IP
- **CORS**: Whitelist frontend origin only
- **Temp Cleanup**: Automatic cleanup of cloned repositories

## 🎯 Fallback Mechanism

BobInsight implements a 3-tier fallback system:

1. **Fallback A**: API key missing or API unreachable → Serve hardcoded mock JSON
2. **Fallback B**: Response time > 15s → Serve pre-cached demo repositories
3. **Fallback C**: Success rate < 80% → Use local AST parser (future enhancement)

This ensures the frontend graph **never breaks**, even if the IBM Bob API is unavailable.

## 🧪 Testing

### Example Repositories

Try these repositories for testing:

- `https://github.com/expressjs/express` - Express.js web framework
- `https://github.com/facebook/react` - React library
- `https://github.com/nodejs/node` - Node.js runtime

### Manual Testing

1. Enter a GitHub URL in the input field
2. Click "Analyze Repository"
3. Wait for the graph to load
4. Click on nodes to see file details
5. Click on edges to see function call relationships

## 📦 Deployment

### Production Deployment Guide

**📖 See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for complete deployment instructions.**

The guide covers:
- ✅ Configuring API base URLs for production
- ✅ Platform-specific deployment (Vercel, Heroku, Railway, Docker)
- ✅ Environment variable configuration
- ✅ CORS setup
- ✅ Troubleshooting common issues

### Quick Deploy Options

#### Option 1: Same-Origin Deployment (Recommended)
Deploy frontend and backend on the same domain. No `VITE_API_BASE_URL` configuration needed.

#### Option 2: Separate Domains
Set `VITE_API_BASE_URL` to your backend URL:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```

#### Option 3: Platform Services
Deploy to Vercel (frontend) + Heroku/Railway (backend):
```bash
VITE_API_BASE_URL=https://your-backend-app.herokuapp.com
```

### Environment Variables for Production

**Backend:**
```env
WATSONX_BASE_URL=<your-watsonx-url>
IBM_CLOUD_API_KEY=<your-api-key>
WATSONX_PROJECT_ID=<your-project-id>
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

**Frontend:**
```env
VITE_API_BASE_URL=https://your-backend-url.com
# Or leave empty for same-origin deployment
```

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3000 is available
- Verify Node.js version (20+)
- Check `.env` file exists in `apps/backend/`

### Frontend can't connect to backend
- Verify backend is running on port 3000
- Check CORS configuration in `apps/backend/src/server.ts`
- Verify proxy configuration in `apps/frontend/vite.config.ts`

### Analysis fails
- Check if the GitHub URL is valid and public
- Verify IBM Bob API key (or rely on fallback)
- Check backend logs for detailed error messages

## 📚 Documentation

- [Project Plan](./BOBINSIGHT_PROJECT_PLAN.md) - Detailed implementation plan
- [Agent Instructions](./AGENTS.md) - AI agent guidelines
- [Shared Types](./packages/shared-types/src/index.ts) - TypeScript interfaces

## 🤝 Contributing

This project was built for the IBM Bob Hackathon 2026. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🏆 Hackathon Team

Built by the BobInsight Team for IBM Bob Hackathon 2026

---

**Happy Analyzing! 🚀**
