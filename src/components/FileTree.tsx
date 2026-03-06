"use client";

import { useState, useCallback } from "react";
import type { TreeNode } from "@/types";

interface FileTreeProps {
  node: TreeNode;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  depth?: number;
}

export function FileTree({
  node,
  selectedFile,
  onSelectFile,
  depth = 0,
}: FileTreeProps) {
  const [expanded, setExpanded] = useState(depth < 1);

  const toggle = useCallback(() => setExpanded((v) => !v), []);

  const name = node.path.split("/").pop() || node.path;
  const isDir = node.type === "directory";
  const isSelected = !isDir && node.path === selectedFile;

  if (isDir) {
    return (
      <div>
        <button
          onClick={toggle}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[13px] text-gray-700 hover:bg-gray-100"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <span className="text-gray-400 text-[10px]">{expanded ? "▾" : "▸"}</span>
          <span className="truncate font-medium">{name}</span>
        </button>
        {expanded && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTree
                key={child.path}
                node={child}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelectFile(node.path)}
      className={`flex w-full items-center rounded-md px-2 py-1 text-left text-[13px] ${
        isSelected
          ? "bg-indigo-50 text-indigo-700 font-medium"
          : "text-gray-600 hover:bg-gray-50"
      }`}
      style={{ paddingLeft: `${depth * 16 + 24}px` }}
    >
      <span className="truncate">{name}</span>
    </button>
  );
}
