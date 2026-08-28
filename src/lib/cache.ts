import fs from "node:fs/promises";
import path from "node:path";
import { ArchifyArchitectureJson } from "./types";

const CACHE_DIR = path.join(process.cwd(), ".cache", "diagrams");

interface CachedDiagramEntry {
  repo: string;
  jsonIr: ArchifyArchitectureJson;
  html: string;
  createdAt: string;
}

/**
 * Normalizes owner and repo into a safe filesystem filename.
 */
function getCacheFilePath(owner: string, repo: string): string {
  const safeOwner = owner.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  const safeRepo = repo.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return path.join(CACHE_DIR, `${safeOwner}__${safeRepo}.json`);
}

/**
 * Retrieves a cached architecture diagram from the local disk if present.
 */
export async function getCachedDiagram(
  owner: string,
  repo: string
): Promise<{ jsonIr: ArchifyArchitectureJson; html: string } | null> {
  try {
    const filePath = getCacheFilePath(owner, repo);
    const content = await fs.readFile(filePath, "utf-8");
    const data: CachedDiagramEntry = JSON.parse(content);
    if (data && data.jsonIr && data.html) {
      return { jsonIr: data.jsonIr, html: data.html };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Saves a newly generated architecture diagram to the local disk cache permanently.
 */
export async function setCachedDiagram(
  owner: string,
  repo: string,
  jsonIr: ArchifyArchitectureJson,
  html: string
): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const filePath = getCacheFilePath(owner, repo);
    const entry: CachedDiagramEntry = {
      repo: `${owner}/${repo}`,
      jsonIr,
      html,
      createdAt: new Date().toISOString(),
    };
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save diagram to disk cache:", error);
  }
}

export interface RecentDiagramItem {
  repo: string;
  title: string;
  subtitle?: string;
  nodeCount: number;
  svgPreview: string;
  createdAt: string;
}

/**
 * Retrieves the most recent architecture diagrams from the local disk cache.
 */
export async function getRecentCachedDiagrams(limit = 4): Promise<RecentDiagramItem[]> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const files = await fs.readdir(CACHE_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const entries: { file: string; mtime: number }[] = [];
    for (const f of jsonFiles) {
      try {
        const stat = await fs.stat(path.join(CACHE_DIR, f));
        entries.push({ file: f, mtime: stat.mtimeMs });
      } catch {}
    }

    // Sort by most recently modified
    entries.sort((a, b) => b.mtime - a.mtime);

    const results: RecentDiagramItem[] = [];
    for (const item of entries.slice(0, limit)) {
      try {
        const raw = await fs.readFile(path.join(CACHE_DIR, item.file), "utf-8");
        const parsed: CachedDiagramEntry = JSON.parse(raw);
        if (!parsed || !parsed.jsonIr || !parsed.html) continue;

        // Extract SVG for thumbnail preview
        let svg = "";
        const match = parsed.html.match(/<svg[\s\S]*?<\/svg>/i);
        if (match) {
          svg = match[0];
        }

        results.push({
          repo: parsed.repo,
          title: parsed.jsonIr.meta?.title || parsed.repo,
          subtitle: parsed.jsonIr.meta?.subtitle || "",
          nodeCount: parsed.jsonIr.components?.length || 0,
          svgPreview: svg,
          createdAt: parsed.createdAt || new Date(item.mtime).toISOString(),
        });
      } catch {}
    }

    return results;
  } catch (error) {
    console.error("Error reading recent cached diagrams:", error);
    return [];
  }
}

