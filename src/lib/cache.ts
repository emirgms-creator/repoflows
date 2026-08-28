import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { Redis } from "@upstash/redis";
import { ArchifyArchitectureJson } from "./types";

const CACHE_DIR = path.join(os.tmpdir(), "repoflows-cache", "diagrams");

interface CachedDiagramEntry {
  repo: string;
  jsonIr: ArchifyArchitectureJson;
  html: string;
  createdAt: string;
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
 * Initializes and returns an Upstash Redis client if environment variables are provided.
 * Supports both Upstash standard variables and Vercel KV environment variables.
 */
let redisClient: Redis | null | undefined = undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  // 1. Direct REST URL and Token format
  let url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL;
  let token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN;

  // 2. Parse from REDIS_URL or KV_URL if only connection string was provided (e.g. rediss://default:token@host:6379)
  if (!url || !token) {
    const rawRedisUrl = process.env.REDIS_URL || process.env.KV_URL;
    if (rawRedisUrl) {
      try {
        const parsed = new URL(rawRedisUrl);
        const host = parsed.hostname;
        const password = parsed.password;
        if (host && password) {
          url = `https://${host}`;
          token = password;
        }
      } catch (err) {
        console.warn("Failed to parse REDIS_URL connection string:", err);
      }
    }
  }

  if (url && token) {
    try {
      redisClient = new Redis({ url, token });
      return redisClient;
    } catch (err) {
      console.warn("Failed to initialize Upstash Redis:", err);
    }
  }

  redisClient = null;
  return null;
}

/**
 * Normalizes owner and repo into a safe filesystem filename.
 */
function getCacheFilePath(owner: string, repo: string): string {
  const safeOwner = owner.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  const safeRepo = repo.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return path.join(CACHE_DIR, `${safeOwner}__${safeRepo}.json`);
}

function getRedisKey(owner: string, repo: string): string {
  return `diagram:${owner.toLowerCase()}/${repo.toLowerCase()}`;
}

/**
 * Retrieves a cached architecture diagram from Upstash Redis (if configured) or local disk.
 */
export async function getCachedDiagram(
  owner: string,
  repo: string
): Promise<{ jsonIr: ArchifyArchitectureJson; html: string } | null> {
  const redis = getRedis();

  // 1. Try Upstash Redis Cloud Cache first
  if (redis) {
    try {
      const data = await redis.get<CachedDiagramEntry>(getRedisKey(owner, repo));
      if (data && data.jsonIr && data.html) {
        return { jsonIr: data.jsonIr, html: data.html };
      }
    } catch (err) {
      console.warn("Upstash Redis get error, falling back to disk cache:", err);
    }
  }

  // 2. Fallback to Local Disk Cache
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
 * Saves a newly generated architecture diagram to Upstash Redis and local disk.
 */
export async function setCachedDiagram(
  owner: string,
  repo: string,
  jsonIr: ArchifyArchitectureJson,
  html: string
): Promise<void> {
  const fullName = `${owner}/${repo}`;
  const now = new Date().toISOString();

  const entry: CachedDiagramEntry = {
    repo: fullName,
    jsonIr,
    html,
    createdAt: now,
  };

  // Extract SVG for thumbnail preview
  let svg = "";
  const match = html.match(/<svg[\s\S]*?<\/svg>/i);
  if (match) {
    svg = match[0];
  }

  const recentItem: RecentDiagramItem = {
    repo: fullName,
    title: jsonIr.meta?.title || fullName,
    subtitle: jsonIr.meta?.subtitle || "",
    nodeCount: jsonIr.components?.length || 0,
    svgPreview: svg,
    createdAt: now,
  };

  // 1. Save to Upstash Redis Cloud Cache (Permanent across serverless instances)
  const redis = getRedis();
  if (redis) {
    try {
      const key = getRedisKey(owner, repo);
      await redis.set(key, entry);

      // Manage recent list: remove existing entry for this repo to avoid duplicates, then push to top
      const recentList = await redis.lrange<string>("recent_diagrams", 0, 19);
      if (Array.isArray(recentList)) {
        for (const raw of recentList) {
          try {
            const parsed: RecentDiagramItem = typeof raw === "string" ? JSON.parse(raw) : raw;
            if (parsed.repo.toLowerCase() === fullName.toLowerCase()) {
              await redis.lrem("recent_diagrams", 0, raw);
            }
          } catch {}
        }
      }

      await redis.lpush("recent_diagrams", JSON.stringify(recentItem));
      await redis.ltrim("recent_diagrams", 0, 19); // Keep latest 20 items
    } catch (err) {
      console.error("Failed to save diagram to Upstash Redis:", err);
    }
  }

  // 2. Save to Local Disk Cache as secondary fallback
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const filePath = getCacheFilePath(owner, repo);
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save diagram to disk cache:", error);
  }
}

/**
 * Retrieves the most recent architecture diagrams from Upstash Redis or local disk cache.
 */
export async function getRecentCachedDiagrams(limit = 4): Promise<RecentDiagramItem[]> {
  const redis = getRedis();

  // 1. Try Upstash Redis first
  if (redis) {
    try {
      const rawItems = await redis.lrange<string>("recent_diagrams", 0, limit - 1);
      if (Array.isArray(rawItems) && rawItems.length > 0) {
        const results: RecentDiagramItem[] = [];
        for (const item of rawItems) {
          try {
            const parsed: RecentDiagramItem = typeof item === "string" ? JSON.parse(item) : item;
            if (parsed && parsed.repo) {
              results.push(parsed);
            }
          } catch {}
        }
        if (results.length > 0) {
          return results;
        }
      }
    } catch (err) {
      console.warn("Upstash Redis recent query error, falling back to disk:", err);
    }
  }

  // 2. Fallback to Local Disk Cache
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
