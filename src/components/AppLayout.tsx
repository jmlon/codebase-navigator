"use client";

import { useState } from "react";
import { RepositoryPanel } from "@/components/panels/RepositoryPanel";
import { VisualizationCanvas } from "@/components/panels/VisualizationCanvas";
import { CodeViewer } from "@/components/panels/CodeViewer";
import { ChatPanel } from "@/components/panels/ChatPanel";
import { AnalysisPanel } from "@/components/panels/AnalysisPanel";
import { SettingsModal } from "@/components/SettingsModal";
import { useAppStore } from "@/store";

export function AppLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const repoInfo = useAppStore((s) => s.repo.repoInfo);
  const reset = useAppStore((s) => s.reset);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900">Codebase Navigator</span>
          {repoInfo && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
              {repoInfo.owner}/{repoInfo.repo}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            Change repo
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 shrink-0 border-r border-gray-200">
          <RepositoryPanel />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <VisualizationCanvas />
          </div>
          <AnalysisPanel />
          <div className="h-[38%] shrink-0 border-t border-gray-200 overflow-hidden">
            <CodeViewer />
          </div>
        </div>

        <div className="w-[360px] shrink-0 border-l border-gray-200">
          <ChatPanel />
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
