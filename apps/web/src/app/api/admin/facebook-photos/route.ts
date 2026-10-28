import { NextRequest, NextResponse } from "next/server";
import {
  getStatusImagesSummary,
  updatePhotosFromZip,
  reshuffleRemainingQueue,
  resetAndReshuffleAll,
} from "@/lib/status-images-manager";

export const dynamic = "force-dynamic";

/**
 * Verify admin bearer token or cron secret
 */
async function verifyAdminAuth(req: NextRequest): Promise<{ authorized: boolean; error?: string }> {
  const authHeader = req.headers.get("authorization");
  const cronSecret = req.headers.get("x-cron-secret");
  const configuredSecret = process.env.CRON_SECRET || "taraka_cron_secret_secure_key_2026";

  if (cronSecret && cronSecret === configuredSecret) {
    return { authorized: true };
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authorized: false, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return { authorized: false, error: "Token is empty" };
  }

  // Verify token with backend
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005/api/v1";
  try {
    const res = await fetch(`${apiUrl}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return { authorized: false, error: "Invalid or expired session" };
    }

    const userData = (await res.json()) as { role?: string };
    const allowedRoles = ["SUPER_ADMIN", "CONTENT", "SUPPORT", "FINANCE"];
    if (!userData.role || !allowedRoles.includes(userData.role)) {
      return { authorized: false, error: "Insufficient admin permissions" };
    }

    return { authorized: true };
  } catch (err) {
    console.warn("[AdminFacebookPhotos] Auth validation network error, checking CRON_SECRET fallback:", err);
    // If backend is unreachable or local dev, permit if token equals cron secret
    if (token === configuredSecret) {
      return { authorized: true };
    }
    return { authorized: false, error: "Failed to verify admin credentials with backend" };
  }
}

/**
 * GET /api/admin/facebook-photos
 * Returns total images, queue status, used images, remaining images, and full gallery list
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }

  try {
    const summary = getStatusImagesSummary();
    return NextResponse.json({ ok: true, data: summary });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}

/**
 * POST /api/admin/facebook-photos
 * Accepts either:
 * - multipart/form-data: file (.zip archive of photos), mode ("replace" | "append")
 * - application/json: { action: "reshuffle" | "reset" }
 */
export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  // 1. Handling ZIP File Upload (multipart/form-data)
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const mode = (formData.get("mode") as string) === "append" ? "append" : "replace";

      if (!file) {
        return NextResponse.json(
          { ok: false, error: "No ZIP file provided in 'file' field" },
          { status: 400 }
        );
      }

      const fileName = file.name || "";
      if (!fileName.toLowerCase().endsWith(".zip")) {
        return NextResponse.json(
          { ok: false, error: "Uploaded file must be a .zip archive (e.g. status-photos.zip)" },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length === 0) {
        return NextResponse.json({ ok: false, error: "Uploaded ZIP file is empty" }, { status: 400 });
      }

      const result = await updatePhotosFromZip(buffer, mode);

      return NextResponse.json({
        ok: true,
        message: `Successfully extracted ${result.extractedCount} photos. Shuffled queue initialized with ${result.totalImages} one-time-use photos!`,
        data: result,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("[AdminFacebookPhotos] ZIP upload failed:", err);
      return NextResponse.json(
        { ok: false, error: `Failed to process ZIP archive: ${errorMsg}` },
        { status: 400 }
      );
    }
  }

  // 2. Handling Queue Actions (application/json)
  try {
    const body = (await req.json()) as { action?: string };
    const action = body?.action;

    if (action === "reshuffle") {
      const summary = reshuffleRemainingQueue();
      return NextResponse.json({
        ok: true,
        message: "Unused photos in the queue have been reshuffled successfully.",
        data: summary,
      });
    }

    if (action === "reset") {
      const summary = resetAndReshuffleAll();
      return NextResponse.json({
        ok: true,
        message: "All photos have been reset to unused and the entire queue has been reshuffled.",
        data: summary,
      });
    }

    return NextResponse.json(
      { ok: false, error: `Unknown action '${action}'. Supported actions: 'reshuffle', 'reset'` },
      { status: 400 }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 400 });
  }
}
