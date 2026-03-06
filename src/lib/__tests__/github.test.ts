import { describe, it, expect } from "vitest";
import { parseRepoUrl, buildTreeFromFlat } from "@/lib/github";

describe("parseRepoUrl", () => {
  it("parses full HTTPS URL", () => {
    const result = parseRepoUrl("https://github.com/octocat/Hello-World");
    expect(result).toEqual({ owner: "octocat", repo: "Hello-World" });
  });

  it("parses URL with trailing slash", () => {
    const result = parseRepoUrl("https://github.com/octocat/Hello-World/");
    expect(result).toEqual({ owner: "octocat", repo: "Hello-World" });
  });

  it("parses URL with .git suffix", () => {
    const result = parseRepoUrl("https://github.com/octocat/Hello-World.git");
    expect(result).toEqual({ owner: "octocat", repo: "Hello-World" });
  });

  it("parses owner/repo shorthand", () => {
    const result = parseRepoUrl("octocat/Hello-World");
    expect(result).toEqual({ owner: "octocat", repo: "Hello-World" });
  });

  it("handles owner with hyphens and dots", () => {
    const result = parseRepoUrl("my-org.name/my-repo.js");
    expect(result).toEqual({ owner: "my-org.name", repo: "my-repo.js" });
  });

  it("throws for invalid URL", () => {
    expect(() => parseRepoUrl("not-a-valid-url")).toThrow(
      "Invalid GitHub repository URL or path"
    );
  });

  it("throws for empty string", () => {
    expect(() => parseRepoUrl("")).toThrow(
      "Invalid GitHub repository URL or path"
    );
  });

  it("throws for URL with only owner", () => {
    expect(() => parseRepoUrl("https://github.com/octocat")).toThrow(
      "Invalid GitHub repository URL or path"
    );
  });
});

describe("buildTreeFromFlat", () => {
  it("builds tree from flat GitHub API response", () => {
    const items = [
      { path: "src", type: "tree" },
      { path: "src/index.ts", type: "blob" },
      { path: "src/utils", type: "tree" },
      { path: "src/utils/helpers.ts", type: "blob" },
      { path: "package.json", type: "blob" },
      { path: "README.md", type: "blob" },
    ];

    const tree = buildTreeFromFlat(items);

    expect(tree.path).toBe("");
    expect(tree.type).toBe("directory");
    expect(tree.children).toHaveLength(3);

    const src = tree.children!.find((c) => c.path === "src");
    expect(src).toBeDefined();
    expect(src!.type).toBe("directory");
    expect(src!.children).toHaveLength(2);

    const indexTs = src!.children!.find((c) => c.path === "src/index.ts");
    expect(indexTs).toBeDefined();
    expect(indexTs!.type).toBe("file");

    const utils = src!.children!.find((c) => c.path === "src/utils");
    expect(utils).toBeDefined();
    expect(utils!.type).toBe("directory");
    expect(utils!.children).toHaveLength(1);

    const helpers = utils!.children!.find(
      (c) => c.path === "src/utils/helpers.ts"
    );
    expect(helpers).toBeDefined();
    expect(helpers!.type).toBe("file");

    const pkg = tree.children!.find((c) => c.path === "package.json");
    expect(pkg).toBeDefined();
    expect(pkg!.type).toBe("file");
  });

  it("returns empty root for empty input", () => {
    const tree = buildTreeFromFlat([]);
    expect(tree.path).toBe("");
    expect(tree.type).toBe("directory");
    expect(tree.children).toEqual([]);
  });

  it("handles items without path", () => {
    const items = [
      { path: "file.ts", type: "blob" },
      { type: "blob" },
    ];

    const tree = buildTreeFromFlat(items);
    expect(tree.children).toHaveLength(1);
    expect(tree.children![0].path).toBe("file.ts");
  });

  it("handles deeply nested structure", () => {
    const items = [
      { path: "a", type: "tree" },
      { path: "a/b", type: "tree" },
      { path: "a/b/c", type: "tree" },
      { path: "a/b/c/deep.ts", type: "blob" },
    ];

    const tree = buildTreeFromFlat(items);
    const a = tree.children!.find((c) => c.path === "a");
    const b = a!.children!.find((c) => c.path === "a/b");
    const c = b!.children!.find((c) => c.path === "a/b/c");
    const deep = c!.children!.find((c) => c.path === "a/b/c/deep.ts");
    expect(deep).toBeDefined();
    expect(deep!.type).toBe("file");
  });
});
