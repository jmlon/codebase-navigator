"use client";

import { useMemo, useCallback } from "react";
import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotContext } from "@/hooks/useCopilotContext";
import { useCopilotActions } from "@/hooks/useCopilotActions";
import { useAppStore } from "@/store";
import { flattenTree } from "@/lib/analyzer";

export function ChatPanel() {
  useCopilotContext();
  useCopilotActions();

  const repo = useAppStore((s) => s.repo);

  const fileList = useMemo(() => {
    if (!repo.tree) return "";
    return flattenTree(repo.tree).join("\n");
  }, [repo.tree]);

  const makeSystemMessage = useCallback(
    (contextString: string, instructions?: string) => {
      const repoSection = repo.repoInfo
        ? `\n\nLOADED REPOSITORY: ${repo.repoInfo.owner}/${repo.repoInfo.repo} (branch: ${repo.repoInfo.branch})\n\nFILE LIST:\n${fileList}\n`
        : "\n\nNo repository is currently loaded.\n";

      return `You are a Codebase Navigator assistant. You MUST use tool calls to answer questions. NEVER answer with plain text about the repository. ALWAYS call a tool.
${repoSection}
CRITICAL RULES — follow these strictly:
1. For ANY question about the repository (how it works, what files do X, architecture, features, etc.) you MUST call the "analyzeRepository" tool. Pass "query" = the user's question and "explanation" = your detailed answer referencing actual file paths from the FILE LIST above.
2. To show a file, call "fetchFileContent" with the exact file path from the list above.
3. To generate a diagram, call "generateFlowDiagram" with file paths and a diagram type.
4. To highlight specific lines, call "highlightCode".
5. NEVER respond with only text. ALWAYS call a tool first, then add a brief summary after.
6. Use ONLY file paths from the FILE LIST above. The repository IS loaded — never say otherwise.

${instructions || ""}

${contextString}`;
    },
    [repo.repoInfo, fileList]
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-400">AI Assistant</span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <CopilotChat
          makeSystemMessage={makeSystemMessage}
          labels={{
            title: "Codebase Navigator",
            initial: "Ask me anything about the loaded repository. For example:\n\n• How does this repo work?\n• What files implement the API layer?\n• Show the request flow for user login.\n• Where is the database configured?",
          }}
          className="h-full"
        />
      </div>
    </div>
  );
}
