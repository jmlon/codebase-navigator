"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";

const EDGE_COLORS: Record<string, string> = {
  import: "#818cf8",
  call: "#2dd4bf",
  flow: "#6366f1",
};

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const edgeType = (data?.edgeType as string) || "import";
  const label = data?.label as string | undefined;
  const stroke = EDGE_COLORS[edgeType] || "#94a3b8";

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke,
          strokeWidth: 2,
          strokeDasharray: edgeType === "flow" ? "5,5" : undefined,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              background: "white",
              color: "#6b7280",
              border: "1px solid #e5e7eb",
            }}
            className="rounded px-1.5 py-0.5 text-[10px]"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
