# We Built a "Google Maps for Code" in One Session. Here's How.

You know that feeling. A new project. Hundreds of files. You `git clone`, open the repo, and immediately wonder: *what am I even looking at?*

You grep for `auth`. 47 results. You trace an import chain three files deep. You open a fourth file, forget why you opened the first. An hour later, you still don't know how login works.

**What if you could just... ask?**

"How does authentication work in this repo?"

And get back a visual dependency graph, highlighted code, and a plain-English explanation -- instantly.

That's exactly what we built. And the wild part? **The entire application was planned, coded, tested, reviewed, and deployed using Zenflow** -- an AI-powered development workflow that treats shipping software like a structured engineering process, not a chatbot conversation.

---

## The Product: Codebase Navigator

Think of it as **Google Maps, but for code**.

You paste a GitHub URL. The app loads the entire repository structure. Then you just talk to it:

> *"What files implement the API layer?"*
>
> *"Show the request flow for user login."*
>
> *"Where is the database configured?"*

The AI doesn't just answer in text. It **updates the entire UI simultaneously**:

| Panel | What It Does |
|-------|-------------|
| **Repository Explorer** | Interactive file tree -- click any file to view source |
| **AI Chat** | Natural language Q&A powered by CopilotKit |
| **Visualization Canvas** | Live React Flow graphs -- dependency maps, architecture diagrams, request flows |
| **Code Viewer** | Syntax-highlighted source with relevant lines marked in amber |

One question. Four panels update. Zero context switching.

---

## The Secret Sauce: Three Technologies That Click Together

### 1. GitHub MCP -- The Eyes

The app needs to *see* inside repositories. We used the **MCP (Model Context Protocol) pattern** with GitHub's API via Octokit to give our AI structured access to:

- Full repository trees (recursive, including nested directories)
- Raw file contents (base64-decoded on the server)
- Code search with text-match fragments

The key design decision: **the AI never calls GitHub directly.** All data flows through server-side API routes that cache responses, keep tokens secure, and return clean, structured data. The LLM gets organized information, not raw API dumps.

```
"How does auth work?"
    -> CopilotKit analyzes the question
        -> Fetches relevant files via /api/github/file
            -> Extracts imports, traces dependencies
                -> Builds a real dependency graph
                    -> All four UI panels update
```

### 2. CopilotKit -- The Brain

This is where it gets interesting. [CopilotKit](https://copilotkit.ai) isn't just a chatbot wrapper -- it's a framework for building **AI-native applications** where the AI can actually *do things* in your UI.

We self-hosted the CopilotKit runtime inside a Next.js API route. It works with any OpenAI-compatible backend -- including **Ollama for completely free, local inference**. No API keys required. Pull `qwen2.5`, start the app, done.

But the real power is in how CopilotKit connects the AI to the application:

**Agent Context** (`useAgentContext`) -- The AI always knows what repo is loaded, what files exist (up to 500 paths to stay within token limits), what's currently selected, and what the last analysis found. It's not guessing. It's informed. We migrated to CopilotKit V2, which consolidates everything into `@copilotkit/react-core/v2` and replaces the old `useCopilotReadable` hook with `useAgentContext` -- a cleaner API that takes structured JSON-serializable context objects.

**Frontend Tools** (`useFrontendTool`) -- Four tools that go far beyond text responses, now defined with **Zod schemas** for full type safety:

- `analyzeRepository` -- Finds relevant files, fetches their contents, extracts actual `import`/`require` statements, resolves paths, and builds a **real dependency graph** with proper edges. Then pushes everything to the Zustand store, which triggers reactive updates across all panels.
- `fetchFileContent` -- Opens any file in the code viewer with one click.
- `generateFlowDiagram` -- Creates focused visualizations for specific file sets.
- `highlightCode` -- Marks specific lines with explanations.

The critical insight: **CopilotKit tools don't return text. They update state.** When the AI calls `analyzeRepository`, it doesn't just tell you about dependencies -- it *draws* them. The graph appears. The files light up. The code viewer scrolls to the relevant section.

That's the difference between a chatbot and an AI-native application. And with V2's Zod-based parameter schemas, the tool definitions are more concise and the handler arguments are fully typed -- no more `as string` casts.

### 3. React Flow + Dagre -- The Canvas

Dependency graphs that look like a plate of spaghetti aren't helpful. We used [React Flow](https://reactflow.dev) with the **dagre** algorithm for automatic hierarchical layouts.

Three custom node types with distinct visual styling:
- **Module nodes** (indigo) -- services, routes, middleware
- **Function nodes** (teal) -- utilities, helpers, pure functions
- **File nodes** (gray) -- everything else

When you load a repo, you immediately see an **architecture overview** -- top-level directories as nodes with edges showing relationships. Ask a question, and the graph morphs into a focused dependency view of the relevant files.

The edges aren't fake. The app actually:
1. Fetches file contents from GitHub
2. Parses every `import` and `require` statement
3. Resolves relative paths, `@/` aliases, and extension variations
4. Builds edges only between files that genuinely import each other

Click any node to jump straight to that file in the code viewer.

---

## How Zenflow Built This (And Why That Matters)

Let's be honest about scope. This isn't a todo app. The Codebase Navigator has:

- **~30 source files** across components, hooks, utilities, API routes, and stores
- **4 API routes** (CopilotKit runtime, GitHub tree/file/search)
- **4 CopilotKit actions** with real business logic
- **3 custom React Flow node types** + custom edges
- **A dagre-based graph layout engine**
- **A code analysis pipeline** (import extraction, path resolution, pattern matching)
- **80 unit tests** across 4 test suites
- **A landing page, settings system, and production deployment**

Building this manually would be a multi-day sprint for an experienced full-stack developer. With Zenflow, it went from zero to deployed in a single structured workflow session.

### The Workflow: Not "Vibe Coding" -- Engineering

Zenflow didn't just autocomplete code. It ran a **six-phase engineering process**:

**Phase 1: Architecture** -- Analyzed requirements, chose technologies, designed the four-panel layout, defined TypeScript interfaces, and planned the data flow before writing a single component.

**Phase 2: Foundation** -- Scaffolded Next.js, configured all 12 dependencies, built the Zustand store with four state slices, and wrote tests for the store. Verified with lint + typecheck + test suite.

**Phase 3: Data Layer** -- Built the complete GitHub integration: Octokit client, API routes, error handling, the `useRepository` hook. Tested. Verified.

**Phase 4: AI Layer** -- Set up the CopilotKit runtime, defined all four actions, built the code analyzer with import extraction and pattern matching. Tested. Verified.

**Phase 5: Visual Layer** -- Custom React Flow nodes, dagre layout, the visualization canvas. Tested. Verified.

**Phase 6: Assembly** -- Wired all panels together, built the landing page, added the settings modal, integrated everything end-to-end.

Each phase was verified with `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, and `npm run build` before advancing. No phase started until the previous one was green.

### The Review: Where Prototypes Become Products

After the initial build worked, Zenflow performed a **comprehensive code review** and identified 14 issues. Then it fixed 11 of them systematically:

| Issue | What Changed |
|-------|-------------|
| API keys exposed in HTTP headers | Moved to httpOnly cookies via `/api/settings` |
| Graphs were star-shaped (fake) | Rewired to use real import-based dependency resolution |
| File fetching duplicated in 4 places | Consolidated into `fetchFile()` with 5-min TTL cache + LRU eviction |
| Large repos blew token limits | Truncated CopilotKit context to 500 file paths |
| Errors silently swallowed | Added proper error reporting to UI |
| Store selectors caused excess re-renders | Refactored to individual `useAppStore((s) => s.x)` selectors |
| Inline SVGs duplicated 5 times | Extracted into shared `<CodeIcon>` and `<SettingsIcon>` components |

This is the part that separates AI-assisted coding from AI-assisted *engineering*. The first pass works. The review pass makes it production-ready.

---

## Zero Cost to Run

One thing we were adamant about: **no API key should be required to try this.**

The default configuration uses [Ollama](https://ollama.ai) -- a local LLM runtime. Pull a model, start the app, everything works on your machine. No OpenAI account. No credit card. No data leaving your network.

```bash
ollama pull qwen2.5
npm run dev
```

For GitHub, public repos work without authentication (60 requests/hour). Add a `GITHUB_TOKEN` for higher limits.

Want to use GPT-4o instead? Open Settings, switch to OpenAI, paste your key. It's stored in your browser and synced via httpOnly cookies -- never logged, never exposed in requests.

---

## The Bigger Picture

We didn't build Codebase Navigator to show off a tech stack. We built it to demonstrate what happens when you combine three ideas:

1. **MCP gives AI structured access to external systems** -- GitHub repos become queryable data sources, not opaque URLs.

2. **CopilotKit V2 turns AI responses into UI actions** -- The AI doesn't just *talk about* code. It *shows* you the code, *draws* the graph, *highlights* the lines. `useFrontendTool` + Zod schemas make the tool contracts explicit and type-safe end to end.

3. **Zenflow turns AI coding from chaotic to systematic** -- Planning, implementation, verification, review, and deployment as a repeatable process.

The result is an application that feels less like a chatbot and more like a **colleague who can instantly read and visualize any codebase**.

---

## Try It Yourself

```bash
git clone <repo-url>
cd codebase-navigator
npm install
ollama pull qwen2.5
npm run dev
```

Open `http://localhost:3000`. Paste any public GitHub repo. Ask it anything.

---

## What's Next

We're exploring:

- **PR Diff Explorer** -- paste a pull request URL, get a visual explanation of what changed and why
- **Security Audit Mode** -- automated scanning for common vulnerability patterns
- **"Explain This File"** -- one-click deep dives from the file tree
- **Multi-Repo Support** -- compare architectures across related repositories
- **Embeddable Widget** -- drop Codebase Navigator into your own docs site

---

*Built end-to-end with [Zenflow](https://zencoder.ai), [CopilotKit](https://copilotkit.ai), [React Flow](https://reactflow.dev), and [Ollama](https://ollama.ai). From architecture to deployment -- one structured AI workflow, one session, zero compromises.*
