"use client";

import { useRepository } from "@/hooks/useRepository";
import { RepoInput } from "@/components/RepoInput";
import { FileTree } from "@/components/FileTree";

export function RepositoryPanel() {
  const { loadRepository, loadFile, tree, repoInfo, selectedFile, loading, error } =
    useRepository();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Explorer</p>
        <RepoInput onSubmit={loadRepository} loading={loading} error={error} />
      </div>
      {repoInfo && (
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-2">
          <span className="truncate text-sm font-medium text-gray-900">
            {repoInfo.owner}/{repoInfo.repo}
          </span>
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
            {repoInfo.branch}
          </span>
        </div>
      )}
      <div className="flex-1 overflow-auto px-1 py-1">
        {tree ? (
          <FileTree
            node={tree}
            selectedFile={selectedFile}
            onSelectFile={loadFile}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-6">
            <p className="text-center text-sm text-gray-400">
              {loading ? "Loading..." : "Enter a repository URL to begin"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
