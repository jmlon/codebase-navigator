"use client";

import { useAppStore } from "@/store";

export function AnalysisPanel() {
  const analysis = useAppStore((s) => s.analysis);
  const repo = useAppStore((s) => s.repo);
  const setCodeViewer = useAppStore((s) => s.setCodeViewer);
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);

  const handleFileClick = async (filePath: string) => {
    if (!repo.repoInfo) return;

    setSelectedFile(filePath);

    try {
      const repoUrl = `${repo.repoInfo.owner}/${repo.repoInfo.repo}`;
      const res = await fetch(
        `/api/github/file?repo=${encodeURIComponent(repoUrl)}&path=${encodeURIComponent(filePath)}&ref=${encodeURIComponent(repo.repoInfo.branch)}`
      );
      if (!res.ok) return;
      const data = await res.json();

      const relevantFile = analysis.result?.relevantFiles.find(
        (f) => f.path === filePath
      );
      setCodeViewer(
        data.path,
        data.content,
        relevantFile?.highlightedLines ?? [],
        relevantFile?.relevance
      );
    } catch {
      // silently fail
    }
  };

  if (!analysis.result && !analysis.loading) {
    return null;
  }

  if (analysis.loading) {
    return (
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500">
        Analyzing...
      </div>
    );
  }

  if (analysis.error) {
    return (
      <div className="border-t border-gray-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
        {analysis.error}
      </div>
    );
  }

  const { explanation, relevantFiles } = analysis.result!;

  return (
    <div className="flex flex-col overflow-hidden max-h-[30%] border-t border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Analysis</span>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600">
          {relevantFiles.length} files
        </span>
      </div>
      <div className="flex-1 overflow-auto px-4 py-3">
        <p className="mb-3 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
          {explanation}
        </p>
        {relevantFiles.length > 0 && (
          <div className="space-y-0.5">
            {relevantFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => handleFileClick(file.path)}
                className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-indigo-600 hover:bg-indigo-50"
              >
                <span className="truncate">{file.path}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
