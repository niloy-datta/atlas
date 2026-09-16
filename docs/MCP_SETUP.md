# Model Context Protocol (MCP) Setup Guide

This document outlines the Model Context Protocol (MCP) configuration for the **SkillHub / WORVO (Atlas)** project.

---

## 1. Configuration Locations

Antigravity IDE discovers and loads MCP server definitions from two levels:

1. **Workspace Level (Project-Specific)**:
   - Location: [`.agents/mcp_config.json`](file:///d:/github_repos/niloy-datta/atlas/.agents/mcp_config.json)
   - Highest precedence; tailored specifically to this codebase and database.
2. **Global Level (Machine-Wide)**:
   - Location: [`C:\Users\niloy\.gemini\config\mcp_config.json`](file:///C:/Users/niloy/.gemini/config/mcp_config.json)
   - Fallback configuration for all IDE sessions.

---

## 2. Configured MCP Servers

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://atlas:change-me-for-local-development@localhost:5432/atlas"
      ]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "d:\\github_repos\\niloy-datta\\atlas",
        "E:\\UX UI DESIGN\\NonCorporateJobFinder_NextJS_SpringBoot"
      ]
    },
    "git": {
      "command": "uvx",
      "args": [
        "mcp-server-git",
        "--repository",
        "d:\\github_repos\\niloy-datta\\atlas"
      ]
    },
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest"
      ]
    },
    "firebase": {
      "command": "npx",
      "args": [
        "-y",
        "firebase-tools@latest",
        "mcp"
      ]
    },
    "fetch": {
      "command": "uvx",
      "args": [
        "mcp-server-fetch"
      ]
    },
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    }
  }
}
```

---

## 3. Server Roles & Verification

| MCP Server | Transport | Target / Scope | Status |
| :--- | :--- | :--- | :--- |
| **`postgres`** | Stdio (`npx`) | `localhost:5432/atlas` (PostgreSQL 18.6) | **Verified** (queried 35 tables) |
| **`filesystem`** | Stdio (`npx`) | Project root & Design folder | **Verified** (listed repo tree) |
| **`git`** | Stdio (`uvx`) | Local git repository (`d:\github_repos\niloy-datta\atlas`) | Ready |
| **`chrome-devtools`** | Stdio (`npx`) | Headless/UI Chrome browser testing & inspection | Ready |
| **`firebase`** | Stdio (`npx`) | Firebase tools & emulators | Ready |
| **`fetch`** | Stdio (`uvx`) | Web content fetching | Ready |
| **`memory`** | Stdio (`npx`) | Persistent knowledge graph | Ready |

---

## 4. Live Verification Examples

### PostgreSQL MCP Server Query
Executing `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';` directly via `postgres:query`:
- Returned all 35 tables including:
  - `users`, `user_roles`, `worker_profiles`, `worker_skills`, `worker_preferences`
  - `shifts`, `jobs`, `applications`, `credentials`, `organizations`

### Filesystem MCP Server Directory Listing
Executing `list_directory` on `d:\github_repos\niloy-datta\atlas` via `filesystem:list_directory`:
- Successfully accessed and traversed the codebase structure (`backend/`, `frontend/`, `.agents/`, `docs/`, `scripts/`).
