"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
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

  useFrontendTool({
    name: "analyzeRepository",
    description:
      "Analyze the loaded repository to answer a question. Call this whenever the user asks about the repo structure, how it works, or about specific features. The handler automatically finds relevant files and generates a visualization.",
    parameters: z.object({
      query: z.string().describe("The user's question about the codebase"),
      explanation: z.string().describe("Your detailed explanation answering the question, referencing specific files from the repository"),
    }),
    handler: async ({ query, explanation }) => {
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

  useFrontendTool({
    name: "fetchFileContent",
    description:
      "Fetch and display a file from the repository in the code viewer panel.",
    parameters: z.object({
      filePath: z.string().describe("The exact file path to fetch (e.g. src/main.rs)"),
    }),
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

  useFrontendTool({
    name: "generateFlowDiagram",
    description:
      "Generate a visual diagram from a list of file paths. Automatically creates nodes and layout.",
    parameters: z.object({
      files: z.array(z.string()).describe("List of file paths to include in the diagram"),
      diagramType: z.enum(["dependency", "flow", "architecture"]).describe("Type of diagram to generate"),
    }),
    handler: async ({ files, diagramType }) => {
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
        setVisualization(graph.nodes, graph.edges, diagramType);
        return `Diagram generated with ${graph.nodes.length} nodes and ${graph.edges.length} dependency edges.`;
      }

      const flowNodes: FlowNode[] = files.map((f, i) => ({
        id: `node-${i}`,
        type: categorizeFileType(f),
        label: f.split("/").pop() || f,
        metadata: { fullPath: f },
      }));
      setVisualization(flowNodes, [], diagramType);
      return `Diagram generated with ${flowNodes.length} nodes.`;
    },
  }, [repo.repoInfo]);

  useFrontendTool({
    name: "highlightCode",
    description:
      "Show a file in the code viewer with specific lines highlighted.",
    parameters: z.object({
      filePath: z.string().describe("Path of the file to display"),
      lines: z.array(z.number()).describe("Line numbers to highlight"),
      explanation: z.string().describe("Explanation of the highlighted lines"),
    }),
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
