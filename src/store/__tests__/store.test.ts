import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/store";
import type { RepoInfo, AnalysisResult, FlowNode, FlowEdge, TreeNode } from "@/types";

const mockRepoInfo: RepoInfo = {
  owner: "testowner",
  repo: "testrepo",
  branch: "main",
};

const mockTree: TreeNode = {
  path: "",
  type: "directory",
  children: [
    { path: "src", type: "directory", children: [{ path: "src/index.ts", type: "file" }] },
    { path: "package.json", type: "file" },
  ],
};

const mockNodes: FlowNode[] = [
  { id: "1", type: "module", label: "AuthModule" },
  { id: "2", type: "function", label: "login" },
];

const mockEdges: FlowEdge[] = [
  { id: "e1", source: "1", target: "2", type: "call", label: "invokes" },
];

const mockAnalysis: AnalysisResult = {
  explanation: "Auth uses JWT tokens",
  relevantFiles: [{ path: "src/auth.ts", relevance: "main auth logic" }],
  flowDiagram: { nodes: mockNodes, edges: mockEdges },
};

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.getState().reset();
  });

  describe("repo slice", () => {
    it("sets repo info", () => {
      useAppStore.getState().setRepoInfo(mockRepoInfo);
      expect(useAppStore.getState().repo.repoInfo).toEqual(mockRepoInfo);
    });

    it("sets tree", () => {
      useAppStore.getState().setTree(mockTree);
      expect(useAppStore.getState().repo.tree).toEqual(mockTree);
    });

    it("sets selected file", () => {
      useAppStore.getState().setSelectedFile("src/index.ts");
      expect(useAppStore.getState().repo.selectedFile).toBe("src/index.ts");
    });

    it("sets loading state", () => {
      useAppStore.getState().setRepoLoading(true);
      expect(useAppStore.getState().repo.loading).toBe(true);
    });

    it("sets error", () => {
      useAppStore.getState().setRepoError("Not found");
      expect(useAppStore.getState().repo.error).toBe("Not found");
    });

    it("clears repo info", () => {
      useAppStore.getState().setRepoInfo(mockRepoInfo);
      useAppStore.getState().setRepoInfo(null);
      expect(useAppStore.getState().repo.repoInfo).toBeNull();
    });
  });

  describe("analysis slice", () => {
    it("sets analysis result", () => {
      useAppStore.getState().setAnalysisResult(mockAnalysis);
      expect(useAppStore.getState().analysis.result).toEqual(mockAnalysis);
    });

    it("sets analysis loading", () => {
      useAppStore.getState().setAnalysisLoading(true);
      expect(useAppStore.getState().analysis.loading).toBe(true);
    });

    it("sets analysis error", () => {
      useAppStore.getState().setAnalysisError("Failed");
      expect(useAppStore.getState().analysis.error).toBe("Failed");
    });

    it("clears analysis result", () => {
      useAppStore.getState().setAnalysisResult(mockAnalysis);
      useAppStore.getState().setAnalysisResult(null);
      expect(useAppStore.getState().analysis.result).toBeNull();
    });
  });

  describe("visualization slice", () => {
    it("sets visualization data", () => {
      useAppStore.getState().setVisualization(mockNodes, mockEdges, "dependency");
      const viz = useAppStore.getState().visualization;
      expect(viz.nodes).toEqual(mockNodes);
      expect(viz.edges).toEqual(mockEdges);
      expect(viz.graphType).toBe("dependency");
    });

    it("clears visualization", () => {
      useAppStore.getState().setVisualization(mockNodes, mockEdges, "flow");
      useAppStore.getState().clearVisualization();
      const viz = useAppStore.getState().visualization;
      expect(viz.nodes).toEqual([]);
      expect(viz.edges).toEqual([]);
      expect(viz.graphType).toBeNull();
    });
  });

  describe("code viewer slice", () => {
    it("sets code viewer state", () => {
      useAppStore.getState().setCodeViewer("src/auth.ts", "const x = 1;", [1], "variable declaration");
      const cv = useAppStore.getState().codeViewer;
      expect(cv.filePath).toBe("src/auth.ts");
      expect(cv.content).toBe("const x = 1;");
      expect(cv.highlightedLines).toEqual([1]);
      expect(cv.explanation).toBe("variable declaration");
    });

    it("sets code viewer with defaults", () => {
      useAppStore.getState().setCodeViewer("src/auth.ts", "const x = 1;");
      const cv = useAppStore.getState().codeViewer;
      expect(cv.highlightedLines).toEqual([]);
      expect(cv.explanation).toBeNull();
    });

    it("clears code viewer", () => {
      useAppStore.getState().setCodeViewer("src/auth.ts", "code");
      useAppStore.getState().clearCodeViewer();
      const cv = useAppStore.getState().codeViewer;
      expect(cv.filePath).toBeNull();
      expect(cv.content).toBeNull();
      expect(cv.highlightedLines).toEqual([]);
      expect(cv.explanation).toBeNull();
    });
  });

  describe("reset", () => {
    it("resets all state to initial values", () => {
      useAppStore.getState().setRepoInfo(mockRepoInfo);
      useAppStore.getState().setTree(mockTree);
      useAppStore.getState().setSelectedFile("file.ts");
      useAppStore.getState().setAnalysisResult(mockAnalysis);
      useAppStore.getState().setVisualization(mockNodes, mockEdges, "architecture");
      useAppStore.getState().setCodeViewer("file.ts", "code", [1, 2]);

      useAppStore.getState().reset();

      const state = useAppStore.getState();
      expect(state.repo.repoInfo).toBeNull();
      expect(state.repo.tree).toBeNull();
      expect(state.repo.selectedFile).toBeNull();
      expect(state.repo.loading).toBe(false);
      expect(state.repo.error).toBeNull();
      expect(state.analysis.result).toBeNull();
      expect(state.analysis.loading).toBe(false);
      expect(state.visualization.nodes).toEqual([]);
      expect(state.visualization.edges).toEqual([]);
      expect(state.visualization.graphType).toBeNull();
      expect(state.codeViewer.filePath).toBeNull();
      expect(state.codeViewer.content).toBeNull();
    });
  });
});
