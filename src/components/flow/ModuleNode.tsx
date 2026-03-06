"use client";

import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";

interface ModuleNodeData {
  label: string;
  nodeType: string;
  metadata?: Record<string, string>;
  [key: string]: unknown;
}

export function ModuleNode({ data }: NodeProps & { data: ModuleNodeData }) {
  const isService = data.nodeType === "service";
  const accent = isService ? "#7c3aed" : "#4f46e5";
  const bg = isService ? "#f5f3ff" : "#eef2ff";
  const border = isService ? "#c4b5fd" : "#a5b4fc";

  return (
    <div
      className="rounded-lg px-4 py-3 min-w-[160px] text-center shadow-sm hover:shadow-md transition-shadow"
      style={{ background: bg, border: `1.5px solid ${border}` }}
    >
      <Handle type="target" position={Position.Top} style={{ background: accent, width: 8, height: 8, border: "2px solid white" }} />
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: accent }}>
        {isService ? "Service" : "Module"}
      </div>
      <div className="text-sm font-semibold truncate text-gray-900">
        {data.label}
      </div>
      {data.metadata?.fullPath && (
        <div className="text-[10px] mt-1 truncate text-gray-400">
          {data.metadata.fullPath}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: accent, width: 8, height: 8, border: "2px solid white" }} />
    </div>
  );
}
