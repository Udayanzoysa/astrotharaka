import { NextResponse, type NextRequest } from "next/server";
import { getApiUrl } from "@/lib/env";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!filename) {
    return new NextResponse("Filename is required", { status: 400 });
  }

  const apiUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    getApiUrl() ||
    "http://localhost:3005/api/v1";
  const cleanApiUrl = apiUrl.replace(/\/$/, "");
  const targetUrl = `${cleanApiUrl}/blogs/media/${encodeURIComponent(filename)}`;

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      return new NextResponse("Media not found", { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const cacheControl =
      res.headers.get("cache-control") || "public, max-age=31536000, immutable";

    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": cacheControl,
      },
    });
  } catch (err: unknown) {
    return new NextResponse(err instanceof Error ? err.message : "Failed to fetch media", { status: 502 });
  }
}

