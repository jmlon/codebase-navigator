"use client";

import { useCopilotAction } from "@copilotkit/react-core";
import { useAppStore } from "@/store";
import { findFilesByQuery, categorizeFileType, flattenTree, extractImports, buildDependencyNodes } from "@/lib/analyzer";
import { fetchFile } from "@/lib/fetch-file";
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

        const capped = matchedPaths.slice(0, 15);
        let graph: { nodes: FlowNode[]; edges: FlowEdge[] };

        if (repo.repoInfo && capped.length > 0) {
          const fileDataPromises = capped.map(async (p) => {
            try {
              const content = await fetchFile(repo.repoInfo!.owner, repo.repoInfo!.repo, p, repo.repoInfo!.branch);
              return { path: p, imports: extractImports(content) };
            } catch {
              return { path: p, imports: [] };
            }
          });
          const fileData = await Promise.all(fileDataPromises);
          graph = buildDependencyNodes(fileData);

          for (const node of graph.nodes) {
            node.type = categorizeFileType(node.metadata?.fullPath || node.id);
          }
        } else {
          graph = {
            nodes: capped.map((p, i) => ({
              id: `node-${i}`,
              type: categorizeFileType(p),
              label: p.split("/").pop() || p,
              metadata: { fullPath: p },
            })),
            edges: [],
          };
        }

        setAnalysisResult({
          explanation,
          relevantFiles: files,
          flowDiagram: graph,
        });

        if (graph.nodes.length > 0) {
          setVisualization(graph.nodes, graph.edges, "dependency");
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
        const content = await fetchFile(repo.repoInfo.owner, repo.repoInfo.repo, filePath, repo.repoInfo.branch);
        setCodeViewer(filePath, content);
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

      if (repo.repoInfo && files.length > 0) {
        const fileDataPromises = files.slice(0, 20).map(async (f) => {
          try {
            const content = await fetchFile(repo.repoInfo!.owner, repo.repoInfo!.repo, f, repo.repoInfo!.branch);
            return { path: f, imports: extractImports(content) };
          } catch {
            return { path: f, imports: [] };
          }
        });
        const fileData = await Promise.all(fileDataPromises);
        const graph = buildDependencyNodes(fileData);
        for (const node of graph.nodes) {
          node.type = categorizeFileType(node.metadata?.fullPath || node.id);
        }
        setVisualization(graph.nodes, graph.edges, graphType);
        return `Diagram generated with ${graph.nodes.length} nodes and ${graph.edges.length} dependency edges.`;
      }

      const flowNodes: FlowNode[] = files.map((f, i) => ({
        id: `node-${i}`,
        type: categorizeFileType(f),
        label: f.split("/").pop() || f,
        metadata: { fullPath: f },
      }));
      setVisualization(flowNodes, [], graphType);
      return `Diagram generated with ${flowNodes.length} nodes.`;
    },
  }, [repo.repoInfo]);

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
        const content = await fetchFile(repo.repoInfo.owner, repo.repoInfo.repo, filePath, repo.repoInfo.branch);
        setCodeViewer(filePath, content, lines, explanation);
        return `Showing ${filePath} with ${lines.length} highlighted lines.`;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch file";
        return `Error: ${message}`;
      }
    },
  }, [repo.repoInfo]);
}
