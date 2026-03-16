# Building a "Google Maps for Codebases" with Zenflow, CopilotKit, and GitHub MCP

Ever tried to understand a large, unfamiliar codebase? You open the repo, stare at dozens of folders, and think: *where do I even start?*

That's the problem we set out to solve. We built **Codebase Navigator** -- a web app that lets you connect any GitHub repository and ask questions about it in plain English. It responds with visual dependency graphs, architecture diagrams, highlighted code, and natural language explanations.

And we built the entire thing using **Zenflow** as our AI-powered development workflow.

---

## What We Built

Codebase Navigator is a four-panel web application:

- **Repository Panel** -- browse the file tree of any public GitHub repo
- **AI Assistant Panel** -- ask natural language questions like "How does authentication work?" or "What files implement the API layer?"
- **Visualization Canvas** -- interactive React Flow graphs showing module dependencies, request flows, and architecture diagrams
- **Code Viewer** -- view source code with highlighted relevant lines

The idea is simple: connect a repo, ask a question, and get a visual answer. No need to read every file.

---

## The Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router, TypeScript) |
| AI Interface | CopilotKit (self-hosted runtime) |
| Data Source | GitHub API via Octokit (MCP pattern) |
| Visualization | React Flow + dagre auto-layout |
| State Management | Zustand |
| LLM Backend | Ollama (local) or OpenAI (configurable) |
| Styling | Tailwind CSS |

---

## How Zenflow Drove the Build

This wasn't a weekend hack. The Codebase Navigator has ~30 source files, 4 API routes, 4 CopilotKit actions, custom React Flow nodes, a dagre-based graph layout engine, a code analysis pipeline, and 80 unit tests. Building this from scratch would typically take days of careful planning and implementation.

With Zenflow, the entire project was planned, implemented, tested, reviewed, and deployed through a structured multi-step workflow.

### Step-by-Step Execution

Zenflow broke the project into six sequential steps, each building on the previous:

1. **Project Initialization** -- scaffolded Next.js, installed all dependencies, set up TypeScript types and the Zustand store with four slices (repo, analysis, visualization, codeViewer)

2. **GitHub API Integration** -- built the Octokit client layer with `getRepoTree`, `getFileContent`, and `searchCode`, plus three API routes and the `useRepository` hook

3. **CopilotKit Runtime & Actions** -- set up the self-hosted CopilotKit runtime at `/api/copilotkit`, defined four copilot actions (`analyzeRepository`, `fetchFileContent`, `generateFlowDiagram`, `highlightCode`), and built the code analysis utilities

4. **Visualization Engine** -- created custom React Flow nodes (ModuleNode, FunctionNode, FileNode), custom edges, and the dagre-based auto-layout system

5. **UI Panels & Layout** -- assembled the four-panel layout, landing page, settings modal, and wired everything together

6. **End-to-End Integration & Testing** -- integrated all pieces, fixed issues, ran full verification suite

Each step was verified with `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, and `npm run build` before moving on.

### The Review Cycle

After the initial build, Zenflow performed a comprehensive code review that identified 14 issues across high, medium, and low severity. Then it systematically fixed 11 of them:

- **Security**: moved API keys from request headers to httpOnly cookies
- **Real dependency graphs**: replaced placeholder star-shaped graphs with actual import-based dependency resolution using `extractImports()` and `buildDependencyNodes()`
- **Shared utilities**: consolidated 4 duplicated file-fetching patterns into a single `fetchFile()` utility with 5-minute TTL caching and LRU eviction
- **Token limits**: truncated the CopilotKit readable context to 500 file paths for large repos
- **Error handling**: replaced silent `catch {}` blocks with proper error reporting
- **Performance**: refactored store selectors from full destructuring to individual selectors for optimal re-renders

This review-and-fix cycle is what separates a prototype from a production-ready application.

---

## MCP: The Data Layer

The project uses the **MCP (Model Context Protocol) pattern** for GitHub integration. Instead of the LLM calling GitHub directly, we built a structured data layer:

```
User Question
    -> CopilotKit Action (analyzeRepository)
        -> GitHub API Routes (/api/github/tree, /api/github/file)
            -> Octokit (@octokit/rest)
                -> GitHub API
```

The GitHub MCP layer provides three capabilities:
- **Repository structure** -- fetch the full file tree via `git.getTree` with recursive traversal
- **File contents** -- fetch any file's content via `repos.getContent`, decoded from base64
- **Code search** -- search across the repo using GitHub's code search API with text match fragments

This separation keeps the GitHub token server-side, provides caching, and gives the AI structured data to work with rather than raw API responses.

---

## CopilotKit: The AI Interface

CopilotKit handles the conversational AI layer. Here's how the pieces fit together:

### Self-Hosted Runtime

The CopilotKit runtime runs as a Next.js API route at `/api/copilotkit`. It uses the `OpenAIAdapter` which works with any OpenAI-compatible API -- including Ollama for fully local, free inference:

```typescript
const openai = new OpenAI({ baseURL, apiKey });
const serviceAdapter = new OpenAIAdapter({ openai, model });
const runtime = new CopilotRuntime();
```

### Readable Context

Using `useCopilotReadable`, we expose the repository state to the LLM:
- Repository info (owner, repo, branch)
- File paths (up to 500, to stay within token limits)
- Currently selected file
- Latest analysis results
- Code viewer state

This means the AI always knows what repo is loaded and what files exist.

### Actions

Four `useCopilotAction` hooks give the AI tools to work with:

- **analyzeRepository** -- finds relevant files matching a query, fetches their contents, extracts imports, builds a real dependency graph, and updates both the visualization canvas and analysis panel
- **fetchFileContent** -- loads a specific file into the code viewer
- **generateFlowDiagram** -- creates focused dependency graphs for specific file sets
- **highlightCode** -- highlights specific lines in the code viewer with explanations

The key insight: actions don't just return text. They update the Zustand store, which triggers reactive UI updates across all four panels simultaneously.

### System Prompt Engineering

The chat panel uses CopilotKit's `makeSystemMessage` to inject the full file list and strict instructions:

```
CRITICAL RULES:
1. For ANY question about the repository, ALWAYS call "analyzeRepository"
2. To show a file, call "fetchFileContent"
3. To generate a diagram, call "generateFlowDiagram"
4. NEVER respond with only text. ALWAYS call a tool first.
```

This ensures the AI uses the tools rather than hallucinating answers about the codebase.

---

## The Visualization Engine

The visualization system uses React Flow with three custom node types and dagre for automatic graph layout.

When you load a repository, `buildOverviewGraph` immediately generates an architecture overview -- grouping top-level directories into nodes and creating edges between related modules.

When you ask a question, `buildDependencyNodes` does the real work:
1. Finds files matching your query
2. Fetches their contents from GitHub
3. Extracts all `import` and `require` statements
4. Resolves import paths (including `@/` aliases and relative paths)
5. Builds edges between files that actually import each other
6. Categorizes nodes by type (service, module, file) for visual styling

The result is an accurate dependency graph -- not a placeholder -- that updates reactively as you ask different questions.

---

## Running Without API Keys

One design goal was making the app work without any paid API keys. The settings modal lets you switch between:

- **Ollama** (default) -- runs against a local Ollama instance at `http://localhost:11434/v1`. Pull any model (`qwen2.5`, `llama3`, etc.) and it works immediately. Completely free.
- **OpenAI** -- for users who want GPT-4o or similar. The API key is stored in the browser's localStorage and synced to the server via httpOnly cookies.

For GitHub, the app works with unauthenticated requests (60 req/hr rate limit) for public repos. Set `GITHUB_TOKEN` for higher limits.

---

## What Zenflow Got Right

Building this project highlighted several strengths of using Zenflow as a development workflow:

**Structured planning that actually worked.** The six-step plan wasn't just a checklist -- each step had clear deliverables, specific files to create, and verification commands. This prevented the common problem of "I'll figure it out as I go" turning into spaghetti.

**Iterative refinement.** The initial build worked but had real issues -- star-shaped graphs, duplicated code, silent error swallowing, security concerns with API keys in headers. The review-and-fix cycle caught and resolved these systematically.

**Test-driven confidence.** 80 tests across 4 test suites meant that each change could be verified immediately. When refactoring the file-fetching logic from 4 duplicated patterns into one shared utility, the tests caught regressions instantly.

**Full-stack coherence.** Zenflow maintained consistency across the entire stack -- from API route signatures to TypeScript types to Zustand store shape to React component props. Everything fit together because the same context was maintained throughout the build.

---

## Try It

The app is deployed and live. You can also run it locally:

```bash
git clone <repo-url>
cd codebase-navigator
npm install
# Pull an Ollama model for local AI
ollama pull qwen2.5
# Start the app
npm run dev
```

Open `http://localhost:3000`, paste any GitHub repo URL, and start asking questions.

---

## What's Next

Some stretch features we'd like to add:

- **Architecture overview mode** -- automatic high-level architecture diagrams on repo load
- **PR diff explanations** -- connect a PR and get a visual explanation of what changed
- **"Explain this file" quick actions** -- one-click explanations from the file tree
- **Security audit mode** -- scan for common security patterns and anti-patterns
- **Documentation generator** -- auto-generate docs from code analysis

---

*Built with Zenflow, CopilotKit, React Flow, and Ollama. The entire application -- from initial planning to production deployment -- was developed through Zenflow's structured AI workflow.*
