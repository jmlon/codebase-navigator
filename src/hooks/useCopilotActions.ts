"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useAppStore } from "@/store";
import { findFilesByQuery, categorizeFileType, flattenTree } from "@/lib/analyzer";
import type { FlowNode, FlowEdge, RelevantFile } from "@/types";

export function useCopilotActions() {
  const repo = useAppStore((s) => s.repo);
  const setAnalysisResult = useAppStore((s) => s.setAnalysisResult);
  const setAnalysisLoading = useAppStore((s) => s.setAnalysisLoading);
  const setAnalysisError = useAppStore((s) => s.setAnalysisError);
  const setVisualization = useAppStore((s) => s.setVisualization);
  const setCodeViewer = useAppStore((s) => s.setCodeViewer);

  useCopilotAction({
    name: "analyzeRepository",
    description:
      "Analyze the loaded repository to answer a question. Call this whenever the user asks about the repo structure, how it works, or about specific features. The handler automatically finds relevant files and generates a visualization.",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "The user's question about the codebase",
        required: true,
      },
      {
        name: "explanation",
        type: "string",
        description: "Your detailed explanation answering the question, referencing specific files from the repository",
        required: true,
      },
    ],
    handler: async ({ query, explanation }) => {
      if (!query || !explanation) {
        return "Please provide both a query and explanation.";
      }

      setAnalysisLoading(true);
      setAnalysisError(null);

      try {
        let matchedPaths: string[] = [];
        if (repo.tree) {
          matchedPaths = findFilesByQuery(repo.tree, query);
          if (matchedPaths.length === 0) {
            const allFiles = flattenTree(repo.tree);
            matchedPaths = allFiles.slice(0, 20);
          }
        }

        const files: RelevantFile[] = matchedPaths.map((p) => ({
          path: p,
          relevance: "Matched query pattern",
        }));

        const nodes: FlowNode[] = matchedPaths.map((p, i) => ({
          id: `node-${i}`,
          type: categorizeFileType(p),
          label: p.split("/").pop() || p,
          metadata: { fullPath: p },
        }));

        const edges: FlowEdge[] = [];
        for (let i = 1; i < nodes.length && i < 15; i++) {
          edges.push({
            id: `edge-${i}`,
            source: nodes[0].id,
            target: nodes[i].id,
            type: "flow" as const,
          });
        }

        setAnalysisResult({
          explanation,
          relevantFiles: files,
          flowDiagram: { nodes, edges },
        });

        if (nodes.length > 0) {
          setVisualization(nodes, edges, "architecture");
        }

        return `Analysis complete. Found ${files.length} relevant files. The visualization and file list have been updated.`;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Analysis failed";
        setAnalysisError(message);
        return `Error: ${message}`;
      } finally {
        setAnalysisLoading(false);
      }
    },
  }, [repo.tree, repo.repoInfo]);

  useCopilotAction({
    name: "fetchFileContent",
    description:
      "Fetch and display a file from the repository in the code viewer panel.",
    parameters: [
      {
        name: "filePath",
        type: "string",
        description: "The exact file path to fetch (e.g. src/main.rs)",
        required: true,
      },
    ],
    handler: async ({ filePath }) => {
      if (!repo.repoInfo) {
        return "No repository loaded.";
      }

      try {
        const repoUrl = `${repo.repoInfo.owner}/${repo.repoInfo.repo}`;
        const res = await fetch(
          `/api/github/file?repo=${encodeURIComponent(repoUrl)}&path=${encodeURIComponent(filePath)}&ref=${encodeURIComponent(repo.repoInfo.branch)}`
        );
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to fetch file");
        }
        const data = await res.json();
        setCodeViewer(data.path, data.content);
        return `File loaded: ${filePath}`;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch file";
        return `Error: ${message}`;
      }
    },
  }, [repo.repoInfo]);

  useCopilotAction({
    name: "generateFlowDiagram",
    description:
      "Generate a visual diagram from a list of file paths. Automatically creates nodes and layout.",
    parameters: [
      {
        name: "files",
        type: "string[]",
        description: "List of file paths to include in the diagram",
        required: true,
      },
      {
        name: "diagramType",
        type: "string",
        description: "Type: dependency, flow, or architecture",
        required: true,
      },
    ],
    handler: async ({ files, diagramType }) => {
      const graphType = diagramType as "dependency" | "flow" | "architecture";

      const flowNodes: FlowNode[] = files.map((f, i) => ({
        id: `node-${i}`,
        type: categorizeFileType(f),
        label: f.split("/").pop() || f,
        metadata: { fullPath: f },
      }));

      const flowEdges: FlowEdge[] = [];
      for (let i = 1; i < flowNodes.length; i++) {
        flowEdges.push({
          id: `edge-${i}`,
          source: flowNodes[0].id,
          target: flowNodes[i].id,
          type: "flow" as const,
        });
      }

      setVisualization(flowNodes, flowEdges, graphType);
      return `Diagram generated with ${flowNodes.length} nodes.`;
    },
  }, []);

  useCopilotAction({
    name: "highlightCode",
    description:
      "Show a file in the code viewer with specific lines highlighted.",
    parameters: [
      {
        name: "filePath",
        type: "string",
        description: "Path of the file to display",
        required: true,
      },
      {
        name: "lines",
        type: "number[]",
        description: "Line numbers to highlight",
        required: true,
      },
      {
        name: "explanation",
        type: "string",
        description: "Explanation of the highlighted lines",
        required: true,
      },
    ],
    handler: async ({ filePath, lines, explanation }) => {
      if (!repo.repoInfo) {
        return "No repository loaded.";
      }

      try {
        const repoUrl = `${repo.repoInfo.owner}/${repo.repoInfo.repo}`;
        const res = await fetch(
          `/api/github/file?repo=${encodeURIComponent(repoUrl)}&path=${encodeURIComponent(filePath)}&ref=${encodeURIComponent(repo.repoInfo.branch)}`
        );
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to fetch file");
        }
        const data = await res.json();
        setCodeViewer(data.path, data.content, lines, explanation);
        return `Showing ${filePath} with ${lines.length} highlighted lines.`;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch file";
        return `Error: ${message}`;
      }
    },
  }, [repo.repoInfo]);
}
