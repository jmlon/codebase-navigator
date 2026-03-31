# Codebase Navigator

An AI-powered tool for exploring and understanding GitHub repositories. Connect any public repo, ask questions in natural language, and get visual explanations with dependency graphs, architecture diagrams, and traceable logic flows.

## Features

- **Natural language Q&A** — Ask how authentication works, where the API layer is, or how services connect
- **Interactive visualizations** — Dependency maps, request flow diagrams, and architecture graphs rendered on an interactive canvas
- **Code viewer** — Highlighted code snippets with exact file paths and line numbers
- **File tree browser** — Navigate the full repository structure
- **Configurable LLM backend** — Switch between OpenAI and Ollama (local) from the in-app settings



https://github.com/user-attachments/assets/f8044f52-67dc-4403-99a6-91214b1e7547



## Tech Stack

- [Next.js](https://nextjs.org) 16 / React 19
- [CopilotKit](https://copilotkit.ai) for AI chat and actions
- [React Flow](https://reactflow.dev) (`@xyflow/react`) + [dagre](https://github.com/dagrejs/dagre) for graph layout
- [Octokit](https://github.com/octokit/rest.js) for GitHub API access
- [Zustand](https://zustand-demo.pmnd.rs/) for state management
- [Tailwind CSS](https://tailwindcss.com) v4

## Prerequisites

- Node.js 18+
- One of the following LLM backends:
  - **Ollama** (default) — install from [ollama.com](https://ollama.com) and pull a model (default: `qwen2.5`)
  - **OpenAI** — an API key with access to chat completions

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. (Optional) Set environment variables to override defaults:

```bash
# Defaults to Ollama at localhost:11434 with qwen2.5
export OPENAI_BASE_URL="http://localhost:11434/v1"
export OPENAI_API_KEY="ollama"
export OPENAI_MODEL="qwen2.5"
```

Or configure the LLM provider from the **Settings** modal in the app UI.

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) and enter a GitHub repository (e.g. `owner/repo` or a full GitHub URL).

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── copilotkit/    # CopilotKit runtime endpoint
│   │   ├── github/        # GitHub API proxy (file, search, tree)
│   │   └── settings/      # LLM settings persistence
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── flow/              # React Flow node types (FileNode, FunctionNode, ModuleNode, CustomEdge)
│   ├── panels/            # Main UI panels (Chat, CodeViewer, Analysis, Repository, VisualizationCanvas)
│   ├── AppLayout.tsx      # Main app shell after repo is loaded
│   ├── CopilotProvider.tsx
│   ├── LandingPage.tsx    # Initial repo input screen
│   ├── RepoInput.tsx
│   └── SettingsModal.tsx
├── hooks/                 # Custom hooks (useCopilotActions, useCopilotContext, useRepository)
├── lib/                   # Core logic (analyzer, github client, graph layout, file fetching)
├── store/                 # Zustand stores (app state, settings)
└── types/                 # TypeScript type definitions
```

## Testing

Tests use [Vitest](https://vitest.dev) with [Testing Library](https://testing-library.com).

```bash
npx vitest
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
