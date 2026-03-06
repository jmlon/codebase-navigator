"use client";

import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";

interface FileNodeData {
  label: string;
  nodeType: string;
  metadata?: Record<string, string>;
  [key: string]: unknown;
}

const ACCENT = "#6b7280";

export function FileNode({ data }: NodeProps & { data: FileNodeData }) {
  return (
    <div
      className="rounded-lg px-4 py-3 min-w-[160px] text-center shadow-sm hover:shadow-md transition-shadow"
      style={{ background: "#f9fafb", border: "1.5px solid #e5e7eb" }}
    >
      <Handle type="target" position={Position.Top} style={{ background: ACCENT, width: 8, height: 8, border: "2px solid white" }} />
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1 text-gray-400">
        File
      </div>
      <div className="text-sm font-semibold truncate text-gray-900">
        {data.label}
      </div>
      {data.metadata?.fullPath && (
        <div className="text-[10px] mt-1 truncate text-gray-400">
          {data.metadata.fullPath}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: ACCENT, width: 8, height: 8, border: "2px solid white" }} />
    </div>
  );
}
