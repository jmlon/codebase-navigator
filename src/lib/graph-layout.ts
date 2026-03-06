import dagre from "dagre";
import type { FlowNode, FlowEdge } from "@/types";
import type { Node, Edge } from "@xyflow/react";

export interface LayoutOptions {
  direction?: "TB" | "LR" | "BT" | "RL";
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

const DEFAULT_OPTIONS: Required<LayoutOptions> = {
  direction: "TB",
  nodeWidth: 200,
  nodeHeight: 60,
  rankSep: 80,
  nodeSep: 40,
};

export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const g = new dagre.graphlib.Graph();

  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: opts.direction,
    ranksep: opts.rankSep,
    nodesep: opts.nodeSep,
  });

  for (const node of nodes) {
    g.setNode(node.id, {
      width: opts.nodeWidth,
      height: opts.nodeHeight,
    });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - opts.nodeWidth / 2,
        y: pos.y - opts.nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

const NODE_TYPE_MAP: Record<FlowNode["type"], string> = {
  module: "moduleNode",
  function: "functionNode",
  file: "fileNode",
  service: "moduleNode",
};

const EDGE_STYLE_MAP: Record<FlowEdge["type"], { stroke: string; strokeDasharray?: string }> = {
  import: { stroke: "#818cf8" },
  call: { stroke: "#2dd4bf" },
  flow: { stroke: "#6366f1", strokeDasharray: "5,5" },
};

export function toReactFlowNodes(flowNodes: FlowNode[]): Node[] {
  return flowNodes.map((node) => ({
    id: node.id,
    type: NODE_TYPE_MAP[node.type] || "fileNode",
    position: { x: 0, y: 0 },
    data: {
      label: node.label,
      nodeType: node.type,
      metadata: node.metadata,
    },
  }));
}

export function toReactFlowEdges(flowEdges: FlowEdge[]): Edge[] {
  return flowEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "customEdge",
    label: edge.label,
    style: EDGE_STYLE_MAP[edge.type] || { stroke: "#94a3b8" },
    data: {
      edgeType: edge.type,
      label: edge.label,
    },
  }));
}

export function buildLayoutedGraph(
  flowNodes: FlowNode[],
  flowEdges: FlowEdge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const rfNodes = toReactFlowNodes(flowNodes);
  const rfEdges = toReactFlowEdges(flowEdges);
  return applyDagreLayout(rfNodes, rfEdges, options);
}
