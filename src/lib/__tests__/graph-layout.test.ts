import { describe, it, expect } from "vitest";
import {
  applyDagreLayout,
  toReactFlowNodes,
  toReactFlowEdges,
  buildLayoutedGraph,
} from "@/lib/graph-layout";
import type { FlowNode, FlowEdge } from "@/types";
import type { Node, Edge } from "@xyflow/react";

const sampleFlowNodes: FlowNode[] = [
  { id: "a", type: "module", label: "ModuleA", metadata: { fullPath: "src/a.ts" } },
  { id: "b", type: "function", label: "helperB", metadata: { fullPath: "src/b.ts" } },
  { id: "c", type: "file", label: "config.ts", metadata: { fullPath: "src/config.ts" } },
  { id: "d", type: "service", label: "APIRoute", metadata: { fullPath: "src/api/route.ts" } },
];

const sampleFlowEdges: FlowEdge[] = [
  { id: "e1", source: "a", target: "b", type: "import", label: "imports" },
  { id: "e2", source: "a", target: "c", type: "call", label: "calls" },
  { id: "e3", source: "b", target: "d", type: "flow", label: "request" },
];

describe("toReactFlowNodes", () => {
  it("converts FlowNodes to React Flow nodes", () => {
    const rfNodes = toReactFlowNodes(sampleFlowNodes);
    expect(rfNodes).toHaveLength(4);
    expect(rfNodes[0].id).toBe("a");
    expect(rfNodes[0].type).toBe("moduleNode");
    expect(rfNodes[0].data.label).toBe("ModuleA");
    expect(rfNodes[0].data.nodeType).toBe("module");
    expect(rfNodes[0].position).toEqual({ x: 0, y: 0 });
  });

  it("maps service type to moduleNode", () => {
    const rfNodes = toReactFlowNodes(sampleFlowNodes);
    const serviceNode = rfNodes.find((n) => n.id === "d");
    expect(serviceNode?.type).toBe("moduleNode");
    expect(serviceNode?.data.nodeType).toBe("service");
  });

  it("maps function type to functionNode", () => {
    const rfNodes = toReactFlowNodes(sampleFlowNodes);
    const fnNode = rfNodes.find((n) => n.id === "b");
    expect(fnNode?.type).toBe("functionNode");
  });

  it("maps file type to fileNode", () => {
    const rfNodes = toReactFlowNodes(sampleFlowNodes);
    const fileNode = rfNodes.find((n) => n.id === "c");
    expect(fileNode?.type).toBe("fileNode");
  });

  it("handles empty array", () => {
    expect(toReactFlowNodes([])).toEqual([]);
  });

  it("includes metadata in data", () => {
    const rfNodes = toReactFlowNodes(sampleFlowNodes);
    expect(rfNodes[0].data.metadata).toEqual({ fullPath: "src/a.ts" });
  });
});

describe("toReactFlowEdges", () => {
  it("converts FlowEdges to React Flow edges", () => {
    const rfEdges = toReactFlowEdges(sampleFlowEdges);
    expect(rfEdges).toHaveLength(3);
    expect(rfEdges[0].id).toBe("e1");
    expect(rfEdges[0].source).toBe("a");
    expect(rfEdges[0].target).toBe("b");
    expect(rfEdges[0].type).toBe("customEdge");
  });

  it("applies correct stroke for import edges", () => {
    const rfEdges = toReactFlowEdges(sampleFlowEdges);
    expect(rfEdges[0].style?.stroke).toBe("#818cf8");
  });

  it("applies correct stroke for call edges", () => {
    const rfEdges = toReactFlowEdges(sampleFlowEdges);
    expect(rfEdges[1].style?.stroke).toBe("#2dd4bf");
  });

  it("applies dashed stroke for flow edges", () => {
    const rfEdges = toReactFlowEdges(sampleFlowEdges);
    expect(rfEdges[2].style?.stroke).toBe("#6366f1");
    expect(rfEdges[2].style?.strokeDasharray).toBe("5,5");
  });

  it("includes edge data with edgeType and label", () => {
    const rfEdges = toReactFlowEdges(sampleFlowEdges);
    expect(rfEdges[0].data?.edgeType).toBe("import");
    expect(rfEdges[0].data?.label).toBe("imports");
  });

  it("handles empty array", () => {
    expect(toReactFlowEdges([])).toEqual([]);
  });
});

describe("applyDagreLayout", () => {
  it("positions nodes using dagre", () => {
    const nodes: Node[] = [
      { id: "1", position: { x: 0, y: 0 }, data: { label: "A" } },
      { id: "2", position: { x: 0, y: 0 }, data: { label: "B" } },
    ];
    const edges: Edge[] = [{ id: "e1", source: "1", target: "2" }];

    const result = applyDagreLayout(nodes, edges);
    expect(result.nodes).toHaveLength(2);
    expect(typeof result.nodes[0].position.x).toBe("number");
    expect(typeof result.nodes[0].position.y).toBe("number");
    expect(result.nodes[0].position).not.toEqual(result.nodes[1].position);
  });

  it("returns different positions for different nodes", () => {
    const nodes: Node[] = [
      { id: "1", position: { x: 0, y: 0 }, data: { label: "A" } },
      { id: "2", position: { x: 0, y: 0 }, data: { label: "B" } },
    ];
    const edges: Edge[] = [{ id: "e1", source: "1", target: "2" }];

    const result = applyDagreLayout(nodes, edges);
    const pos1 = result.nodes[0].position;
    const pos2 = result.nodes[1].position;
    expect(pos1.x !== pos2.x || pos1.y !== pos2.y).toBe(true);
  });

  it("preserves edge data", () => {
    const nodes: Node[] = [
      { id: "1", position: { x: 0, y: 0 }, data: { label: "A" } },
    ];
    const edges: Edge[] = [];

    const result = applyDagreLayout(nodes, edges);
    expect(result.edges).toEqual(edges);
  });

  it("respects LR direction", () => {
    const nodes: Node[] = [
      { id: "1", position: { x: 0, y: 0 }, data: { label: "A" } },
      { id: "2", position: { x: 0, y: 0 }, data: { label: "B" } },
    ];
    const edges: Edge[] = [{ id: "e1", source: "1", target: "2" }];

    const tbResult = applyDagreLayout(nodes, edges, { direction: "TB" });
    const lrResult = applyDagreLayout(nodes, edges, { direction: "LR" });

    const tbDiffY = Math.abs(tbResult.nodes[0].position.y - tbResult.nodes[1].position.y);
    const lrDiffX = Math.abs(lrResult.nodes[0].position.x - lrResult.nodes[1].position.x);
    expect(tbDiffY).toBeGreaterThan(0);
    expect(lrDiffX).toBeGreaterThan(0);
  });

  it("handles single node", () => {
    const nodes: Node[] = [
      { id: "1", position: { x: 0, y: 0 }, data: { label: "A" } },
    ];
    const result = applyDagreLayout(nodes, []);
    expect(result.nodes).toHaveLength(1);
  });

  it("handles empty inputs", () => {
    const result = applyDagreLayout([], []);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });
});

describe("buildLayoutedGraph", () => {
  it("produces a fully layouted graph from FlowNodes and FlowEdges", () => {
    const result = buildLayoutedGraph(sampleFlowNodes, sampleFlowEdges);
    expect(result.nodes).toHaveLength(4);
    expect(result.edges).toHaveLength(3);

    for (const node of result.nodes) {
      expect(typeof node.position.x).toBe("number");
      expect(typeof node.position.y).toBe("number");
    }
  });

  it("applies layout options", () => {
    const resultTB = buildLayoutedGraph(sampleFlowNodes, sampleFlowEdges, {
      direction: "TB",
    });
    const resultLR = buildLayoutedGraph(sampleFlowNodes, sampleFlowEdges, {
      direction: "LR",
    });
    expect(resultTB.nodes[0].position).not.toEqual(resultLR.nodes[0].position);
  });

  it("handles empty inputs", () => {
    const result = buildLayoutedGraph([], []);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });
});
