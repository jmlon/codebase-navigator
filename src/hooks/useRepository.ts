"use client";

import { useCallback } from "react";
import { useAppStore } from "@/store";
import { buildOverviewGraph } from "@/lib/analyzer";
import type { TreeNode } from "@/types";

interface TreeResponse {
  owner: string;
  repo: string;
  branch: string;
  tree: TreeNode;
}

interface FileResponse {
  path: string;
  content: string;
}

interface SearchResult {
  path: string;
  matches: { fragment: string; lineNumber: number }[];
}

interface SearchResponse {
  results: SearchResult[];
}

export function useRepository() {
  const {
    setRepoInfo,
    setTree,
    setRepoLoading,
    setRepoError,
    setSelectedFile,
    setCodeViewer,
    clearCodeViewer,
    setVisualization,
    repo,
  } = useAppStore();

  const loadRepository = useCallback(
    async (repoUrl: string) => {
      setRepoLoading(true);
      setRepoError(null);
      clearCodeViewer();

      try {
        const res = await fetch(
          `/api/github/tree?repo=${encodeURIComponent(repoUrl)}`
        );
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to fetch repository");
        }
        const data: TreeResponse = await res.json();
        setRepoInfo({ owner: data.owner, repo: data.repo, branch: data.branch });
        setTree(data.tree);
        const overview = buildOverviewGraph(data.tree);
        setVisualization(overview.nodes, overview.edges, "architecture");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load repository";
        setRepoError(message);
      } finally {
        setRepoLoading(false);
      }
    },
    [setRepoInfo, setTree, setRepoLoading, setRepoError, clearCodeViewer, setVisualization]
  );

  const loadFile = useCallback(
    async (filePath: string) => {
      if (!repo.repoInfo) return;

      setSelectedFile(filePath);

      try {
        const repoUrl = `${repo.repoInfo.owner}/${repo.repoInfo.repo}`;
        const res = await fetch(
          `/api/github/file?repo=${encodeURIComponent(repoUrl)}&path=${encodeURIComponent(filePath)}&ref=${encodeURIComponent(repo.repoInfo.branch)}`
        );
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to fetch file");
        }
        const data: FileResponse = await res.json();
        setCodeViewer(data.path, data.content);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load file";
        setRepoError(message);
      }
    },
    [repo.repoInfo, setSelectedFile, setCodeViewer, setRepoError]
  );

  const searchInRepo = useCallback(
    async (query: string): Promise<SearchResult[]> => {
      if (!repo.repoInfo) return [];

      try {
        const repoUrl = `${repo.repoInfo.owner}/${repo.repoInfo.repo}`;
        const res = await fetch(
          `/api/github/search?repo=${encodeURIComponent(repoUrl)}&q=${encodeURIComponent(query)}`
        );
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to search");
        }
        const data: SearchResponse = await res.json();
        return data.results;
      } catch {
        return [];
      }
    },
    [repo.repoInfo]
  );

  return {
    loadRepository,
    loadFile,
    searchInRepo,
    repoInfo: repo.repoInfo,
    tree: repo.tree,
    selectedFile: repo.selectedFile,
    loading: repo.loading,
    error: repo.error,
  };
}
