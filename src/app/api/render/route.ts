import { NextRequest, NextResponse } from "next/server";
import { parseGitHubRepo } from "@/lib/utils";
import { fetchRepoContext } from "@/lib/github";
import { analyzeRepositoryWithGemini } from "@/lib/gemini";
import { renderArchitectureJson } from "@/lib/archify-renderer";
import { getCachedDiagram, setCachedDiagram } from "@/lib/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const repoParam = searchParams.get("repo");

  if (!repoParam || repoParam.length > 150) {
    return new NextResponse("Repository parameter ?repo=owner/repo is required (max 150 characters).", { status: 400 });
  }

  const parsed = parseGitHubRepo(repoParam);
  if (!parsed) {
    return new NextResponse("Invalid repository format.", { status: 400 });
  }

  try {
    const cached = await getCachedDiagram(parsed.owner, parsed.repo);
    if (cached) {
      return new NextResponse(cached.html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=1800, s-maxage=3600",
        },
      });
    }

    const repoContext = await fetchRepoContext(parsed.owner, parsed.repo);
    const jsonIr = await analyzeRepositoryWithGemini(repoContext);
    const html = await renderArchitectureJson(jsonIr);

    await setCachedDiagram(parsed.owner, parsed.repo, jsonIr, html);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=1800, s-maxage=3600",
      },
    });
  } catch (err: unknown) {
    console.error("Render error:", err);
    return new NextResponse("Failed to render architecture diagram. Please try again.", { status: 500 });
  }
}
