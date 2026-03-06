"use client";

import { useMemo } from "react";
import { useCopilotReadable } from "@copilotkit/react-core";
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

  useCopilotReadable({
    description: "Current repository information including owner, name, and branch",
    value: repo.repoInfo,
  }, [repo.repoInfo]);

  useCopilotReadable({
    description: `File paths in the repository (max ${MAX_FILE_PATHS}), one per line. Use these paths with the analyzeRepository and fetchFileContent actions.`,
    value: fileList,
  }, [fileList]);

  useCopilotReadable({
    description: "Currently selected file path in the repository",
    value: repo.selectedFile,
  }, [repo.selectedFile]);

  useCopilotReadable({
    description: "Latest analysis result including explanation, relevant files, and flow diagram",
    value: analysis.result,
  }, [analysis.result]);

  useCopilotReadable({
    description: "Currently viewed file content and highlighted lines in the code viewer",
    value: codeViewer.filePath
      ? { filePath: codeViewer.filePath, highlightedLines: codeViewer.highlightedLines }
      : null,
  }, [codeViewer.filePath, codeViewer.highlightedLines]);
}
