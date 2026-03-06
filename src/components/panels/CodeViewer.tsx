"use client";

import { useAppStore } from "@/store";

export function CodeViewer() {
  const { filePath, content, highlightedLines, explanation } = useAppStore(
    (s) => s.codeViewer
  );

  if (!filePath || content === null) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <p className="text-sm text-gray-400">Select a file or click a graph node to view code</p>
      </div>
    );
  }

  const lines = content.split("\n");
  const highlightSet = new Set(highlightedLines);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <span className="truncate text-sm font-medium text-gray-900">{filePath}</span>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {highlightedLines.length > 0 && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
              {highlightedLines.length} highlighted
            </span>
          )}
          <span className="text-[11px] text-gray-400">{lines.length} lines</span>
        </div>
      </div>
      {explanation && (
        <div className="border-b border-gray-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-700">
          {explanation}
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <pre className="text-[13px] leading-6 font-mono">
          <code>
            {lines.map((line, i) => {
              const lineNum = i + 1;
              const isHighlighted = highlightSet.has(lineNum);
              return (
                <div
                  key={i}
                  className={`flex ${isHighlighted ? "bg-amber-50" : "hover:bg-gray-50"}`}
                >
                  <span className={`inline-block w-12 shrink-0 select-none pr-4 text-right ${isHighlighted ? "text-amber-500" : "text-gray-300"}`}>
                    {lineNum}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-all pr-4 text-gray-800">
                    {line}
                  </span>
                </div>
              );
            })}
          </code>
        </pre>
      </div>
    </div>
  );
}
