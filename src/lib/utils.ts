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
const OWNER_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38}[a-zA-Z0-9])?$/;
const REPO_REGEX = /^[a-zA-Z0-9_.-]{1,100}$/;

function isValid(owner: string, repo: string): boolean {
  if (!owner || !repo) return false;
  if (owner === "." || owner === ".." || repo === "." || repo === "..") return false;
  return OWNER_REGEX.test(owner) && REPO_REGEX.test(repo);
}

export function parseGitHubRepo(input: string): { owner: string; repo: string; fullName: string } | null {
  const trimmed = input.trim().replace(/\.git\/?$/, "").replace(/\/+$/, "");
  if (!trimmed) return null;

  // Match full URL or domain URL
  const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i);
  if (urlMatch) {
    const owner = urlMatch[1];
    const repo = urlMatch[2];
    if (isValid(owner, repo)) {
      return { owner, repo, fullName: `${owner}/${repo}` };
    }
  }

  // Match simple owner/repo
  const simpleMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (simpleMatch) {
    const owner = simpleMatch[1];
    const repo = simpleMatch[2];
    if (isValid(owner, repo)) {
      return { owner, repo, fullName: `${owner}/${repo}` };
    }
  }

  return null;
}
