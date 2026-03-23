"use client";

import { useMemo } from "react";
import { useAgentContext } from "@copilotkit/react-core/v2";
import { useAppStore } from "@/store";
import { flattenTree } from "@/lib/analyzer";
import type { TreeNode } from "@/types";

const MAX_FILE_PATHS = 500;

function treeToPathList(tree: TreeNode | null): string | null {
  if (!tree) return null;
  const paths = flattenTree(tree);
  if (paths.length <= MAX_FILE_PATHS) return paths.join("\n");
  return paths.slice(0, MAX_FILE_PATHS).join("\n") + `\n... and ${paths.length - MAX_FILE_PATHS} more files`;
}

export function useCopilotContext() {
  const repo = useAppStore((s) => s.repo);
  const analysis = useAppStore((s) => s.analysis);
  const codeViewer = useAppStore((s) => s.codeViewer);

  const fileList = useMemo(() => treeToPathList(repo.tree), [repo.tree]);

  useAgentContext({
    description: "Current repository information including owner, name, and branch",
    value: repo.repoInfo ? JSON.stringify(repo.repoInfo) : null,
  });

  useAgentContext({
    description: `File paths in the repository (max ${MAX_FILE_PATHS}), one per line. Use these paths with the analyzeRepository and fetchFileContent actions.`,
    value: fileList,
  });

  useAgentContext({
    description: "Currently selected file path in the repository",
    value: repo.selectedFile,
  });

  useAgentContext({
    description: "Latest analysis result including explanation, relevant files, and flow diagram",
    value: analysis.result ? JSON.stringify(analysis.result) : null,
  });

  useAgentContext({
    description: "Currently viewed file content and highlighted lines in the code viewer",
    value: codeViewer.filePath
      ? JSON.stringify({ filePath: codeViewer.filePath, highlightedLines: codeViewer.highlightedLines })
      : null,
  });

  useAgentContext({
    description: "System instructions",
    value: repo.repoInfo
      ? `You are a Codebase Navigator assistant. You MUST use tool calls to answer questions. NEVER answer with plain text about the repository. ALWAYS call a tool.\n\nLOADED REPOSITORY: ${repo.repoInfo.owner}/${repo.repoInfo.repo} (branch: ${repo.repoInfo.branch})\n\nCRITICAL RULES:\n1. For ANY question about the repository call the "analyzeRepository" tool. Pass "query" = the user's question and "explanation" = your detailed answer referencing actual file paths.\n2. To show a file, call "fetchFileContent" with the exact file path.\n3. To generate a diagram, call "generateFlowDiagram" with file paths and a diagram type.\n4. To highlight specific lines, call "highlightCode".\n5. NEVER respond with only text. ALWAYS call a tool first.\n6. Use ONLY file paths from the file list above. The repository IS loaded.`
      : "You are a Codebase Navigator assistant. No repository is currently loaded. Ask the user to paste a GitHub repository URL in the Repository panel.",
  });
}
