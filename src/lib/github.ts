import { RepoFileInfo } from "./types";

interface GitHubRepoMeta {
  fullName: string;
  description: string;
  language: string;
  stars: number;
  topics: string[];
  defaultBranch: string;
}

export interface RepoContext {
  meta: GitHubRepoMeta;
  fileTree: string[];
  keyFiles: RepoFileInfo[];
}

const PRIORITY_FILENAMES = [
  "README.md",
  "readme.md",
  "package.json",
  "docker-compose.yml",
  "docker-compose.yaml",
  "Dockerfile",
  "requirements.txt",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "server.js",
  "server.ts",
  "main.py",
  "app.py",
  "main.go",
  "src/index.ts",
  "src/main.rs",
];

/**
 * Fetches repository structure and key architectural files from GitHub REST API.
 */
export async function fetchRepoContext(owner: string, repo: string): Promise<RepoContext> {
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "RepoFlows-Architecture-Visualizer",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // 1. Fetch Repository Metadata
  const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(10000),
  });

  if (!repoRes.ok) {
    if (repoRes.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" was not found or is private.`);
    }
    if (repoRes.status === 403) {
      throw new Error("GitHub API rate limit exceeded. Please try again later or configure a GITHUB_TOKEN.");
    }
    throw new Error(`GitHub API Error (${repoRes.status}): ${repoRes.statusText}`);
  }

  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch || "main";

  const meta: GitHubRepoMeta = {
    fullName: repoData.full_name,
    description: repoData.description || "",
    language: repoData.language || "Unknown",
    stars: repoData.stargazers_count || 0,
    topics: repoData.topics || [],
    defaultBranch,
  };

  // 2. Fetch Repository Tree (Top level / Recursive tree)
  let fileTree: string[] = [];
  try {
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers, next: { revalidate: 3600 }, signal: AbortSignal.timeout(10000) }
    );
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      if (treeData.truncated) {
        console.warn(`GitHub tree for ${owner}/${repo} was truncated. Analysis may be incomplete.`);
      }
      if (Array.isArray(treeData.tree)) {
        fileTree = treeData.tree
          .filter((item: { type: string; path: string }) => item.type === "blob")
          .map((item: { type: string; path: string }) => item.path)
          .slice(0, 80); // Cap at 80 paths to keep prompt concise
      }
    }
  } catch (err) {
    console.warn("Tree fetch warning:", err);
  }

  // 3. Select and fetch key architectural files (Prioritizing root-level files first)
  const keyFiles: RepoFileInfo[] = [];
  const filesToFetch = new Set<string>();

  // 3a. First pass: exact root-level matches
  for (const pattern of PRIORITY_FILENAMES) {
    const matched = fileTree.find((f) => f.toLowerCase() === pattern.toLowerCase());
    if (matched && filesToFetch.size < 6) {
      filesToFetch.add(matched);
    }
  }

  // 3b. Second pass: nested architectural files if quota permits
  for (const pattern of PRIORITY_FILENAMES) {
    const matched = fileTree.find((f) => f.endsWith("/" + pattern));
    if (matched && filesToFetch.size < 6) {
      filesToFetch.add(matched);
    }
  }

  // If tree fetch was empty, at least try README.md and package.json
  if (filesToFetch.size === 0) {
    filesToFetch.add("README.md");
    filesToFetch.add("package.json");
    filesToFetch.add("docker-compose.yml");
  }

  // Fetch all key files in parallel
  const rawHeaders: HeadersInit = {
    "User-Agent": "RepoFlows",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fileResults = await Promise.allSettled(
    Array.from(filesToFetch).map(async (filePath) => {
      const fileRes = await fetch(
        `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${filePath}`,
        { headers: rawHeaders, next: { revalidate: 3600 }, signal: AbortSignal.timeout(10000) }
      );

      if (fileRes.ok) {
        const text = await fileRes.text();
        // Truncate file content to avoid overwhelming LLM context
        const truncated = text.length > 5000 ? text.slice(0, 5000) + "\n...[truncated]" : text;
        return {
          path: filePath,
          content: truncated,
          size: text.length,
        } as RepoFileInfo;
      }
      return null;
    })
  );

  for (const result of fileResults) {
    if (result.status === "fulfilled" && result.value) {
      keyFiles.push(result.value);
    }
  }

  return {
    meta,
    fileTree,
    keyFiles,
  };
}
