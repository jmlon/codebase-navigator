# Spec and build

## Configuration
- **Artifacts Path**: {@artifacts_path} → `.zenflow/tasks/{task_id}`

---

## Agent Instructions

Ask the user questions when anything is unclear or needs their input. This includes:
- Ambiguous or incomplete requirements
- Technical decisions that affect architecture or user experience
- Trade-offs that require business context

Do not make assumptions on important decisions — get clarification first.

If you are blocked and need user clarification, mark the current step with `[!]` in plan.md before stopping.

---

## Workflow Steps

### [x] Step: Technical Specification

Difficulty: **Hard**. Full specification saved to `.zenflow/tasks/new-task-9f37/spec.md`.

---

### [x] Step: Project Initialization & Core Setup
<!-- chat-id: b34401db-0e37-45b9-9baa-5c360c45c1c5 -->

Initialize Next.js 15 project with all dependencies, configuration, and base structure.

- Initialize Next.js app with TypeScript, Tailwind CSS, App Router
- Install dependencies: `@copilotkit/react-core`, `@copilotkit/react-ui`, `@copilotkit/runtime`, `openai`, `@octokit/rest`, `@xyflow/react`, `zustand`, `dagre`
- Install dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- Configure `.gitignore`, `.env.example` (OPENAI_API_KEY, GITHUB_TOKEN)
- Create TypeScript types in `src/types/index.ts`
- Create Zustand store in `src/store/index.ts` with all slices (repo, analysis, visualization, codeViewer)
- Write unit tests for the store
- Verify: `npm run lint`, `npx tsc --noEmit`, `npx vitest run`

---

### [x] Step: GitHub API Integration
<!-- chat-id: 0ef23949-cdb4-4dee-b823-41cf718454c0 -->

Build the GitHub API layer (server-side routes + client utilities).

- Create `src/lib/github.ts` with Octokit client helper functions (getRepoTree, getFileContent, searchCode)
- Create API routes:
  - `src/app/api/github/tree/route.ts` - fetch repo tree
  - `src/app/api/github/file/route.ts` - fetch file content
  - `src/app/api/github/search/route.ts` - search code in repo
- Create `src/hooks/useRepository.ts` for frontend repo fetching logic
- Write unit tests for `src/lib/github.ts` utilities
- Verify: `npm run lint`, `npx tsc --noEmit`, `npx vitest run`

---

### [x] Step: CopilotKit Runtime & Actions
<!-- chat-id: 9b563424-f98d-4568-901a-8544b9833f14 -->

Set up CopilotKit self-hosted runtime and define all copilot actions.

- Create `src/app/api/copilotkit/route.ts` with CopilotRuntime + OpenAIAdapter
- Create `src/hooks/useCopilotContext.ts` - expose repo structure, selected file, analysis results via `useCopilotReadable`
- Create `src/hooks/useCopilotActions.ts` - define actions: `analyzeRepository`, `fetchFileContent`, `generateFlowDiagram`, `highlightCode`
- Create `src/lib/analyzer.ts` - code analysis utilities (pattern detection for auth, API, DB, etc.)
- Write unit tests for analyzer utilities
- Verify: `npm run lint`, `npx tsc --noEmit`, `npx vitest run`

---

### [x] Step: Visualization Engine
<!-- chat-id: b810e683-ee04-43bb-b131-12d224ae630d -->

Build the React Flow visualization system with custom nodes, edges, and auto-layout.

- Create `src/lib/graph-layout.ts` - dagre-based auto-layout utility
- Create custom React Flow nodes: `src/components/flow/ModuleNode.tsx`, `FunctionNode.tsx`, `FileNode.tsx`
- Create custom React Flow edge: `src/components/flow/CustomEdge.tsx`
- Create `src/components/panels/VisualizationCanvas.tsx` - main React Flow canvas component
- Write unit tests for graph-layout utility
- Verify: `npm run lint`, `npx tsc --noEmit`, `npx vitest run`

---

### [x] Step: UI Panels & Layout Integration
<!-- chat-id: 6602375b-f5a9-4553-805d-a840aa16c35f -->

Build all UI panels and wire up the four-panel layout.

- Create `src/components/RepoInput.tsx` - repository URL input component
- Create `src/components/FileTree.tsx` - recursive file tree display
- Create `src/components/panels/RepositoryPanel.tsx` - repo URL input + file tree
- Create `src/components/panels/CodeViewer.tsx` - code display with line highlighting
- Create `src/components/panels/ChatPanel.tsx` - CopilotSidebar wrapper
- Create `src/app/layout.tsx` - root layout with CopilotKit provider, CSS imports
- Create `src/app/page.tsx` - main page with resizable four-panel layout
- Update `src/app/globals.css` with panel layout styles
- Verify: `npm run lint`, `npx tsc --noEmit`, `npm run build`

---

### [x] Step: End-to-End Integration & Testing
<!-- chat-id: 24d105fd-f788-4afc-98d5-77ed34a48d03 -->

Wire everything together, verify the full query pipeline works end-to-end.

- Integrate CopilotKit actions with store updates (actions → zustand → UI panels)
- Ensure chat responses trigger visualization updates and code viewer highlights
- Test full flow: enter repo URL → ask question → see explanation + visualization + code
- Run full verification: `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build`
- Write report to `.zenflow/tasks/new-task-9f37/report.md`
