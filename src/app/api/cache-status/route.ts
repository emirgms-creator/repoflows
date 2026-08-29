import { NextResponse } from "next/server";
import { getRedis } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const redis = getRedis();
  const hasRedisUrl = Boolean(process.env.REDIS_URL || process.env.KV_URL);

  let status = "not_configured";
  let pingResult: string | null = null;
  let recentCount = 0;

  if (redis) {
    try {
      const ping = await redis.ping();
      pingResult = String(ping);
      status = pingResult === "PONG" ? "connected" : "unexpected_ping_response";

      const recentList = await redis.lrange("recent_diagrams", 0, 10);
      recentCount = Array.isArray(recentList) ? recentList.length : 0;
    } catch {
      status = "connection_failed";
    }
  }

  return NextResponse.json({
    status,
    connected: status === "connected",
    provider: "Redis Cloud / Standard Redis",
    ping: pingResult,
    recentCount,
    hasRedisUrl,
  });
}
