import { NextResponse } from "next/server";
import IORedis from "ioredis";

export const dynamic = "force-dynamic";

export async function GET() {
  const redisUrl = process.env.REDIS_URL || process.env.KV_URL;
  const hasRedisUrl = Boolean(redisUrl);

  let status = "not_configured";
  let pingResult: string | null = null;
  let recentCount = 0;
  let errorMessage: string | null = null;

  if (redisUrl) {
    let client: IORedis | null = null;
    try {
      client = new IORedis(redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 4000,
        lazyConnect: true,
      });

      await client.connect();
      const ping = await client.ping();
      pingResult = String(ping);
      status = pingResult === "PONG" ? "connected" : "unexpected_ping_response";

      const recentList = await client.lrange("recent_diagrams", 0, 10);
      recentCount = Array.isArray(recentList) ? recentList.length : 0;
    } catch (err: unknown) {
      status = "connection_failed";
      errorMessage = err instanceof Error ? err.message : String(err);
    } finally {
      if (client) {
        try { client.disconnect(); } catch {}
      }
    }
  }

  return NextResponse.json({
    status,
    connected: status === "connected",
    provider: "Redis Cloud / Standard Redis",
    ping: pingResult,
    recentCount,
    error: errorMessage,
    hasRedisUrl,
  });
}
