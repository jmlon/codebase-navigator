# Technical Specification: Codebase Navigator

## Difficulty Assessment: **Hard**

Complex multi-component application requiring: GitHub API integration via MCP, CopilotKit AI assistant integration, real-time visualization with React Flow, code analysis pipeline, and a four-panel UI layout. Multiple integration points, significant state management, and architectural decisions.

---

## Technical Context

### Language & Runtime
- **Language**: TypeScript
- **Runtime**: Node.js 20+
- **Framework**: Next.js 15 (App Router)

### Core Dependencies
- `next` - Full-stack React framework
- `react`, `react-dom` - UI library
- `@copilotkit/react-core` - CopilotKit provider, hooks, chat components
- `@copilotkit/react-ui` - CopilotKit UI styles
- `@copilotkit/runtime` - Self-hosted Copilot Runtime (CopilotRuntime, OpenAIAdapter, copilotRuntimeNextJSAppRouterEndpoint)
- `@octokit/rest` - GitHub API client
- `@xyflow/react` - React Flow for graph visualizations (successor to reactflow)
- `tailwindcss` - Utility-first CSS
- `zustand` - Lightweight state management
- `openai` - OpenAI SDK (used by CopilotKit runtime adapter)

### Dev Dependencies
- `typescript`, `@types/react`, `@types/node`
- `eslint`, `eslint-config-next`
- `vitest`, `@testing-library/react` - Testing

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App (Frontend)                │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Repo     │ │ AI Chat    │ │ Viz      │ │ Code     │ │
│  │ Panel    │ │ Panel      │ │ Canvas   │ │ Viewer   │ │
│  └────┬─────┘ └─────┬──────┘ └────┬─────┘ └────┬─────┘ │
│       │              │             │             │       │
│       └──────────────┴─────────────┴─────────────┘       │
│                          │                               │
│                    Zustand Store                         │
│              (repo state, analysis, viz)                 │
└──────────────────────────┬───────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │   /api/copilotkit       │
              │   (Copilot Runtime)     │
              │   + MCP Client for      │
              │     GitHub MCP          │
              └────────────┬────────────┘
                           │
              ┌────────────┴────────────┐
              │   /api/github/*         │
              │   (GitHub API routes)   │
              │   via @octokit/rest     │
              └─────────────────────────┘
```

### Data Flow
1. User enters a GitHub repo URL in the Repository Panel
2. Backend fetches repo tree and metadata via GitHub API (Octokit)
3. Repo structure is stored in Zustand and exposed to CopilotKit via `useCopilotReadable`
4. User asks a question in the AI Chat Panel (CopilotSidebar)
5. CopilotKit Runtime processes the query, uses `useCopilotAction` handlers to:
   - Fetch specific file contents from GitHub
   - Analyze code for patterns (auth, API, DB, etc.)
   - Generate structured data for visualizations
6. Actions update Zustand store, triggering React Flow graph updates and code viewer highlights

---

## Implementation Approach

### CopilotKit Integration (Self-Hosted Runtime)

**Backend**: Next.js API route at `/api/copilotkit` using:
```typescript
import { CopilotRuntime, OpenAIAdapter, copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";
```

**Frontend**: `CopilotKit` provider wrapping the app with `runtimeUrl="/api/copilotkit"`, using `CopilotSidebar` for the chat panel.

**Hooks used**:
- `useCopilotReadable` - Expose repo structure, selected file, and analysis results as context
- `useCopilotAction` - Define actions: `analyzeRepository`, `fetchFileContent`, `generateFlowDiagram`, `searchCode`

### GitHub Integration

Direct GitHub API calls via `@octokit/rest` in Next.js API routes:
- `GET /api/github/tree` - Fetch repo tree
- `GET /api/github/file` - Fetch file content
- `GET /api/github/search` - Search code in repo

Server-side only (GitHub token stays on server).

### Visualization Engine (React Flow)

Custom React Flow implementation with:
- **Node types**: `moduleNode`, `functionNode`, `fileNode`, `serviceNode`
- **Edge types**: `importEdge`, `callEdge`, `flowEdge`
- **Layouts**: Auto-layout using dagre algorithm
- Data driven by CopilotKit actions that produce `{ nodes: [], edges: [] }` structures

### State Management (Zustand)

Single store with slices:
- `repoSlice` - repo URL, tree structure, selected file
- `analysisSlice` - analysis results, relevant files, explanations
- `visualizationSlice` - nodes, edges, graph type
- `codeViewerSlice` - file content, highlighted lines

---

## Source Code Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with CopilotKit provider
│   ├── page.tsx                # Main page with 4-panel layout
│   ├── api/
│   │   ├── copilotkit/
│   │   │   └── route.ts        # CopilotKit Runtime endpoint
│   │   └── github/
│   │       ├── tree/route.ts   # Fetch repo tree
│   │       ├── file/route.ts   # Fetch file content
│   │       └── search/route.ts # Search code
│   └── globals.css             # Global styles + Tailwind
├── components/
│   ├── panels/
│   │   ├── RepositoryPanel.tsx # Repo URL input + file tree
│   │   ├── ChatPanel.tsx       # CopilotSidebar wrapper
│   │   ├── VisualizationCanvas.tsx # React Flow canvas
│   │   └── CodeViewer.tsx      # Code display with highlights
│   ├── flow/
│   │   ├── ModuleNode.tsx      # Custom React Flow node
│   │   ├── FunctionNode.tsx    # Custom React Flow node
│   │   └── CustomEdge.tsx      # Custom React Flow edge
│   ├── FileTree.tsx            # Recursive file tree component
│   └── RepoInput.tsx           # Repository URL input
├── hooks/
│   ├── useCopilotActions.ts    # CopilotKit action definitions
│   ├── useCopilotContext.ts    # CopilotKit readable bindings
│   └── useRepository.ts       # Repo fetching logic
├── store/
│   └── index.ts                # Zustand store
├── lib/
│   ├── github.ts               # Octokit client + helpers
│   ├── analyzer.ts             # Code analysis utilities
│   └── graph-layout.ts         # Dagre auto-layout for React Flow
└── types/
    └── index.ts                # Shared TypeScript types
```

---

## Key Interfaces / Types

```typescript
interface RepoInfo {
  owner: string;
  repo: string;
  branch: string;
}

interface TreeNode {
  path: string;
  type: "file" | "directory";
  children?: TreeNode[];
}

interface AnalysisResult {
  explanation: string;
  relevantFiles: RelevantFile[];
  flowDiagram: FlowDiagram;
}

interface RelevantFile {
  path: string;
  relevance: string;
  highlightedLines?: number[];
}

interface FlowDiagram {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface FlowNode {
  id: string;
  type: "module" | "function" | "file" | "service";
  label: string;
  metadata?: Record<string, string>;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: "import" | "call" | "flow";
  label?: string;
}
```

---

## CopilotKit Actions

### `analyzeRepository`
- **Params**: `{ query: string }`
- **Behavior**: AI analyzes the repo structure + relevant files to answer the query
- **Output**: Updates `analysisSlice` with explanation, relevant files, and flow diagram

### `fetchFileContent`
- **Params**: `{ filePath: string }`
- **Behavior**: Fetches file from GitHub API, updates code viewer
- **Output**: Updates `codeViewerSlice`

### `generateFlowDiagram`
- **Params**: `{ files: string[], diagramType: "dependency" | "flow" | "architecture" }`
- **Behavior**: AI generates nodes/edges for the requested diagram
- **Output**: Updates `visualizationSlice`

### `highlightCode`
- **Params**: `{ filePath: string, lines: number[], explanation: string }`
- **Behavior**: Shows file with highlighted lines in code viewer
- **Output**: Updates `codeViewerSlice`

---

## Verification Approach

- **Lint**: `npm run lint` (ESLint via next lint)
- **Type check**: `npx tsc --noEmit`
- **Unit tests**: `npx vitest` for store logic, analyzer utilities, graph layout
- **Build**: `npm run build` to verify no build errors
- **Manual**: Load app, connect to a GitHub repo, ask questions, verify visualizations render
