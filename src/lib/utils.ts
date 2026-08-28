import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes user input into owner/repo format.
 * Accepts:
 * - https://github.com/owner/repo
 * - http://github.com/owner/repo/tree/main/...
 * - github.com/owner/repo
 * - owner/repo
 */
export function parseGitHubRepo(input: string): { owner: string; repo: string; fullName: string } | null {
  const trimmed = input.trim().replace(/\.git\/?$/, "");
  if (!trimmed) return null;

  // Match full URL or domain URL
  const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i);
  if (urlMatch) {
    const owner = urlMatch[1];
    const repo = urlMatch[2];
    return { owner, repo, fullName: `${owner}/${repo}` };
  }

  // Match simple owner/repo
  const simpleMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (simpleMatch) {
    const owner = simpleMatch[1];
    const repo = simpleMatch[2];
    return { owner, repo, fullName: `${owner}/${repo}` };
  }

  return null;
}
