import { NextRequest, NextResponse } from "next/server";
import { parseGitHubRepo } from "@/lib/utils";
import { fetchRepoContext } from "@/lib/github";
import { analyzeRepositoryWithGemini } from "@/lib/gemini";
import { renderArchitectureJson } from "@/lib/archify-renderer";
import { getCachedDiagram, setCachedDiagram } from "@/lib/cache";
import { GenerateApiResponse } from "@/lib/types";

export async function POST(req: NextRequest): Promise<NextResponse<GenerateApiResponse>> {
  try {
    const body = await req.json();
    const repoInput = body?.repo || body?.url;

    if (!repoInput || typeof repoInput !== "string" || repoInput.length > 150) {
      return NextResponse.json(
        { success: false, repo: "", error: "Please enter a valid GitHub repository URL or name (max 150 characters)." },
        { status: 400 }
      );
    }

    const parsed = parseGitHubRepo(repoInput);
    if (!parsed) {
      return NextResponse.json(
        { success: false, repo: repoInput, error: "Invalid repository format. Example: vercel/next.js" },
        { status: 400 }
      );
    }

    // 1. Check Local Persistent Disk Cache first
    const cached = await getCachedDiagram(parsed.owner, parsed.repo);
    if (cached) {
      return NextResponse.json({
        success: true,
        repo: parsed.fullName,
        jsonIr: cached.jsonIr,
        html: cached.html,
        cached: true,
      });
    }

    // 2. Fetch Repository Context from GitHub
    const repoContext = await fetchRepoContext(parsed.owner, parsed.repo);

    // 3. Synthesize Architecture JSON IR via Gemini AI
    const jsonIr = await analyzeRepositoryWithGemini(repoContext);

    // 4. Render JSON IR into standalone Archify HTML
    const html = await renderArchitectureJson(jsonIr);

    // 5. Save to Local Persistent Disk Cache permanently
    await setCachedDiagram(parsed.owner, parsed.repo, jsonIr, html);

    return NextResponse.json({
      success: true,
      repo: parsed.fullName,
      jsonIr,
      html,
      cached: false,
    });
  } catch (error: unknown) {
    console.error("API /api/generate error:", error);
    const message = error instanceof Error ? error.message : "An error occurred while analyzing the repository.";
    return NextResponse.json(
      {
        success: false,
        repo: "",
        error: message,
      },
      { status: 500 }
    );
  }
}
