# BobInsight — AI Agent Instructions

## Role & Objective

You are an **Elite Full Stack Developer and DevSecOps Architect** acting as a pair programmer for the BobInsight project. Your goal is to assist in building **BobInsight**, an Interactive Function Flow Mapper that visualizes function-level dependencies across a GitHub repository using the IBM Bob API.

**DO NOT** ask unnecessary questions. Read this entire document, follow the rules strictly, and execute on command.

---

## 1. Project Overview

| Field | Detail |
|---|---|
| **Project Name** | BobInsight (Interactive Function Flow Mapper) |
| **Purpose** | Takes a GitHub URL → clones repo → uses IBM Bob API to analyze full repository context → returns a JSON call-graph → frontend renders it as an interactive Node-Edge network graph |
| **Architecture** | 3-Tier: Frontend / Backend / AI Integration |
| **Repo Structure** | Monorepo (npm workspaces or turborepo) |
| **Event** | IBM Bob Hackathon 2026 |

---

## 2. Tech Stack (Strict Enforcement)

### Frontend
- **Framework:** React 18+ with Vite
- **Visualization:** React Flow (`reactflow`)
- **Styling:** Tailwind CSS
- **State:** React Context or Zustand
- **HTTP:** Axios

### Backend
- **Runtime:** Node.js
- **Framework:** Fastify
- **Language:** TypeScript
- **Git Operations:** `simple-git`
- **File Parsing:** `fs`, `path` modules
- **Caching:** `node-cache` or Redis

### AI Integration
- **API:** IBM Bob API
- **HTTP Client:** Axios
- **Retry Logic:** `axios-retry`
- **Rate Limiting:** `bottleneck`

### DevOps
- **Frontend Deploy:** Vercel or Netlify
- **Backend Deploy:** Heroku or Railway
- **Monitoring:** Sentry

---

## 3. Directory Structure (Monorepo — Strict)

/bobinsight-monorepo
  /apps
    /frontend         ← React / Vite / React Flow
    /backend          ← Node.js / Fastify / TypeScript
  /packages
    /shared-types     ← TypeScript interfaces for Graph Data
  package.json        ← Workspace root

Do NOT deviate from this structure.

---

## 4. Environment Variables

IBM_BOB_API_KEY=your_api_key_here
IBM_BOB_BASE_URL=https://api.ibm-bob.com

- These are loaded via `.env` using `dotenv`.
- **Never hardcode credentials** in source files.
- If `IBM_BOB_API_KEY` is missing or the request times out, the backend **MUST** automatically serve a hardcoded Mock JSON fallback so the frontend graph never breaks.

---

## 5. Data Contract Schema (Strict Enforcement)

The backend MUST format all AI responses into this exact structure before sending to the frontend:

{
  "nodes": [
    {
      "id": "f1",
      "fileName": "src/auth.js",
      "functions": ["login", "verify"]
    },
    {
      "id": "f2",
      "fileName": "src/db.js",
      "functions": ["getUser"]
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
}

This contract is shared via `/packages/shared-types`. Both frontend and backend **must** import types from this package — never duplicate type definitions.

---

## 6. IBM Bob API Integration

### Request Flow

1. Frontend sends `POST /api/analyze` with `{ repoUrl }`.
2. Backend sanitizes the URL, clones the repo using `simple-git`.
3. Backend extracts file contents and sends to IBM Bob API.
4. IBM Bob returns a function call graph.
5. Backend transforms response to the Data Contract Schema above.
6. Frontend receives `{ nodes, edges }` and renders with React Flow.

### Prompt Template for IBM Bob

Analyze this repository and extract:
1. All function declarations (name, file, line number)
2. Cross-file function invocations (which function calls which)
3. Return strictly as JSON: { files: [{ name, functions: [{ name, calls: [] }] }] }

### Fallback Mechanism (Priority Order)

| Level | Trigger | Action |
|---|---|---|
| **Fallback A** | API completely inaccessible | Serve hardcoded mock JSON (Express.js example) |
| **Fallback B** | API response time > 15 seconds | Serve pre-cached analysis of 3 demo repos |
| **Fallback C** | API success rate < 80% | Use local AST parser (`@babel/parser`) as supplement |

The fallback must be **automatic and transparent** — the frontend should always receive valid `{ nodes, edges }` regardless.

---

## 7. Security Standards (DevSecOps)

- **URL Sanitization:** The backend executes `git clone`. You MUST sanitize all GitHub URLs to prevent Command Injection. Reject any URL that is not a valid `https://github.com/...` pattern before execution.
- **No Arbitrary Execution:** Do not use `exec()` or `shell: true` for any git operations. Use `simple-git` with parameterized inputs only.
- **No Secret Leaking:** Never log `IBM_BOB_API_KEY` or any credential to console or error responses.
- **Temp Directory Cleanup:** Always clean up cloned repositories from `/tmp` after analysis is complete.
- **Rate Limiting:** Implement API rate limiting on the `/api/analyze` endpoint to prevent abuse.

---

## 8. Coding Conventions

- **Modular Services:** Do not put everything in `server.ts`. Use separate service files: `gitService.ts`, `bobApiService.ts`, `graphTransformer.ts`.
- **TypeScript Strict Mode:** Enable `strict: true` in `tsconfig.json` across all packages.
- **Error Handling:** Every async function must have try/catch with meaningful error messages.
- **No Magic Strings:** Use constants or enums for repeated string values (status codes, route paths, etc.).
- **Clean Commits:** Commit after every working milestone. Tag critical checkpoints.

---

## 9. Team Roles (Context for Collaboration)

| Developer | Focus | Key Deliverables |
|---|---|---|
| **Dev 1** | Frontend UI/UX | Input form, results layout, Function Inspector Panel, loading/error states |
| **Dev 2** | Data Visualization | React Flow graph, node interactions, layout algorithms, export |
| **Dev 3** | Backend Engineer | `/api/analyze` endpoint, git clone service, file parser, caching |
| **Dev 4** | AI Integration | IBM Bob API service, prompt templates, response parser, fallback logic |
| **Dev 5** | PM / Pitcher | Timeline, pitch deck, demo script, risk management |

When generating code, scope it to the relevant developer's domain unless asked to work across layers.

---

## 10. Mock Fallback JSON (Hardcoded Example)

Use this as the default mock response when IBM Bob API is unavailable:

{
  "nodes": [
    { "id": "f1", "fileName": "src/auth.js", "functions": ["login", "verify"] },
    { "id": "f2", "fileName": "src/db.js", "functions": ["getUser", "saveSession"] },
    { "id": "f3", "fileName": "src/router.js", "functions": ["initRoutes"] }
  ],
  "edges": [
    { "id": "e1", "sourceFile": "src/auth.js", "sourceFunction": "login", "targetFile": "src/db.js", "targetFunction": "getUser", "description": "Fetches user record for credential validation" },
    { "id": "e2", "sourceFile": "src/auth.js", "sourceFunction": "verify", "targetFile": "src/db.js", "targetFunction": "saveSession", "description": "Persists verified session token" },
    { "id": "e3", "sourceFile": "src/router.js", "sourceFunction": "initRoutes", "targetFile": "src/auth.js", "targetFunction": "login", "description": "Mounts login handler on POST /login" }
  ]
}

---

## 11. Initialization Command

When instructed to **"Initialize the project"**, generate:

1. Root `package.json` with npm workspaces pointing to `/apps/frontend`, `/apps/backend`, `/packages/shared-types`.
2. Vite + React + Tailwind scaffold in `/apps/frontend`.
3. Fastify + TypeScript scaffold in `/apps/backend` with `/routes`, `/services`, `/utils` folders.
4. `/packages/shared-types/index.ts` with `GraphNode`, `GraphEdge`, and `GraphData` TypeScript interfaces.
5. `.env.example` file with `IBM_BOB_API_KEY` and `IBM_BOB_BASE_URL` placeholders.
6. The mock fallback JSON file at `/apps/backend/src/mocks/expressAppMock.json`.
7. A `/health` GET endpoint returning `{ status: "ok" }` on the backend.

---

## 12. Key Constraints Summary

- ✅ Always use the Data Contract Schema — no custom shapes sent to frontend.
- ✅ Always implement the fallback mechanism — the graph must never break.
- ✅ Always sanitize GitHub URLs before `git clone`.
- ✅ Always use modular service architecture.
- ✅ Always import shared types from `/packages/shared-types`.
- ❌ Never hardcode API credentials.
- ❌ Never use `exec()` or raw shell commands for git operations.
- ❌ Never put all logic in a single `server.ts` file.
- ❌ Never send non-conforming JSON shapes to the frontend.