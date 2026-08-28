import { NextResponse } from "next/server";
import { getRecentCachedDiagrams } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const recent = await getRecentCachedDiagrams(4);

    return NextResponse.json({
      success: true,
      items: recent,
    });
  } catch (error: unknown) {
    console.error("Failed to fetch recent diagrams:", error);
    const message = error instanceof Error ? error.message : "Failed to load recent diagrams";
    return NextResponse.json(
      { success: false, items: [], error: message },
      { status: 500 }
    );
  }
}

