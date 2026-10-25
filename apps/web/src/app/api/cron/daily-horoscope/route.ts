import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Astro Tharaka Automated Daily Horoscope Poster
 * Triggers every morning at 06:00 AM Sri Lanka Standard Time (00:30 UTC).
 */
async function handleDailyHoroscopeCron(req: NextRequest) {
  const startTime = Date.now();

  // 1. Trigger & Authorization Verification
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const urlSecret = req.nextUrl.searchParams.get("secret");
  const configuredSecret =
    process.env.CRON_SECRET || "taraka_cron_secret_secure_key_2026";

  const isAuthorized =
    authHeader === `Bearer ${configuredSecret}` ||
    cronHeader === configuredSecret ||
    urlSecret === configuredSecret ||
    req.headers.get("user-agent")?.includes("vercel-cron");

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing cron secret authorization" },
      { status: 401 }
    );
  }

  // 2. Compute Sri Lanka Standard Time (UTC+05:30)
  const now = new Date();
  const slstOffsetMs = 5.5 * 60 * 60 * 1000;
  const slstTime = new Date(now.getTime() + slstOffsetMs);
  const slstDateStr = slstTime.toISOString().slice(0, 10);
  const slstTimestamp = slstTime.toISOString().replace("Z", "+05:30");

  console.log(`[AstroTharaka Cron] Daily workflow started at SLST: ${slstTimestamp}`);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005/api/v1";

  try {
    // 3. Data Retrieval & Generation Logic
    // Check if horoscope for today exists, or generate fresh via backend (Gemini API fallback)
    const forceGenerate = req.nextUrl.searchParams.get("force") === "true";
    let horoscopeData: any = null;

    if (!forceGenerate) {
      try {
        const getRes = await fetch(`${apiUrl}/daily-horoscope/${slstDateStr}`);
        if (getRes.ok) {
          const json = await getRes.json();
          if (json.data) horoscopeData = json.data;
        }
      } catch (err) {
        console.warn("[AstroTharaka Cron] Existing record lookup error, will trigger generation:", err);
      }
    }

    if (!horoscopeData || forceGenerate) {
      console.log(`[AstroTharaka Cron] Requesting daily horoscope generation for ${slstDateStr}...`);
      const genRes = await fetch(`${apiUrl}/daily-horoscope/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: slstDateStr,
          force: forceGenerate,
          publishSocial: false,
        }),
      });

      if (!genRes.ok) {
        throw new Error(`Backend horoscope generation failed with HTTP ${genRes.status}`);
      }

      const genJson = await genRes.json();
      horoscopeData = genJson.data;
    }

    if (!horoscopeData) {
      throw new Error("Unable to retrieve or generate daily horoscope payload");
    }

    // 4. Construct Engaging Sinhala Caption Text for Facebook
    const dateDisplay =
      typeof horoscopeData.dateDisplay === "object"
        ? horoscopeData.dateDisplay?.si
        : horoscopeData.dateDisplay || slstDateStr;

    const rahuKalaya =
      typeof horoscopeData.panchanga?.rahuKalaya === "object"
        ? horoscopeData.panchanga.rahuKalaya.si
        : horoscopeData.panchanga?.rahuKalaya || "පෙ.ව. 09:00 - 10:30";

    const subaDishawa =
      typeof horoscopeData.panchanga?.subaDishawa === "object"
        ? horoscopeData.panchanga.subaDishawa.si
        : horoscopeData.panchanga?.subaDishawa || "උතුර";

    const maruDishawa =
      typeof horoscopeData.panchanga?.maruDishawa === "object"
        ? horoscopeData.panchanga.maruDishawa.si
        : horoscopeData.panchanga?.maruDishawa || "නැගෙනහිර";

    const generalNotes =
      typeof horoscopeData.generalNotes === "object"
        ? horoscopeData.generalNotes?.si
        : horoscopeData.generalNotes || "";

    // Build or use prepared caption
    let caption = horoscopeData.socialPost;
    if (typeof caption === "object") {
      caption = caption?.si || "";
    }

    if (!caption || typeof caption !== "string" || caption.trim().length < 50) {
      caption = [
        `🌟 ${dateDisplay} - අද දවසේ පලාපල සහ පංචාංගය 🌟`,
        "",
        "සුභ උදෑසනක්! අද දවසේ පංචාංග විස්තර සහ සුබ මුහුර්ත මෙන්න:",
        "",
        `⏰ රාහු කාලය: ${rahuKalaya}`,
        `🧭 සුබ දිශාව: ${subaDishawa} | මරු සිටින දිශාව: ${maruDishawa}`,
        "",
        "✨ දවසේ පොදු ග්‍රහ චාරය සහ විශේෂ සටහන:",
        generalNotes.slice(0, 320) + (generalNotes.length > 320 ? "..." : ""),
        "",
        "🔮 ඔබේ ලග්නයට අදාළ සම්පූර්ණ දිනපතා පලාපල (රැකියාව, ධනය, ප්‍රේමය, සෞඛ්‍යය සහ ජය අංක) දැන්ම කියවන්න:",
        "👉 https://astrotharaka.com/daily-horoscope",
        "",
        "#AstroTaraka #DailyHoroscope #LagnaPalapala #SriLankaAstrology #Panchangam",
      ].join("\n");
    }

    // 5. Social Media Publishing (Facebook Graph API - Text Post)
    const pageId = process.env.FACEBOOK_PAGE_ID?.trim();
    const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();
    const postingEnabled =
      (process.env.FACEBOOK_POSTING_ENABLED ?? "true").toLowerCase().trim() !== "false";

    let fbStatus = "SKIPPED";
    let fbPostId: string | null = null;
    let fbError: string | null = null;

    if (!postingEnabled) {
      fbStatus = "DISABLED (FACEBOOK_POSTING_ENABLED=false)";
    } else if (!pageId || !pageToken) {
      fbStatus = "SKIPPED (Missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN in env)";
      console.warn(`[AstroTharaka Cron] ${fbStatus}`);
    } else {
      console.log(`[AstroTharaka Cron] Publishing daily caption to Facebook Page ${pageId}...`);

      const fbResponse = await fetch(`https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: caption,
          access_token: pageToken,
        }),
      });

      const fbData = (await fbResponse.json()) as any;

      if (!fbResponse.ok) {
        fbError = fbData?.error?.message || `Facebook API HTTP ${fbResponse.status}`;
        fbStatus = `FAILED: ${fbError}`;
        console.error(`[AstroTharaka Cron] Facebook post failed:`, fbError);
      } else {
        fbPostId = fbData.id;
        fbStatus = "POSTED";
        console.log(`[AstroTharaka Cron] Successfully published to Facebook! Post ID: ${fbPostId}`);
      }

      // 6. Update database record with social status
      try {
        await fetch(`${apiUrl}/daily-horoscope/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: slstDateStr,
            socialPost: caption,
          }),
        });
      } catch (err) {
        console.warn("[AstroTharaka Cron] Failed to sync status back to DB:", err);
      }
    }

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestampSLST: slstTimestamp,
      date: slstDateStr,
      facebook: {
        status: fbStatus,
        postId: fbPostId,
        error: fbError,
      },
      horoscope: {
        dateDisplay,
        rahuKalaya,
        subaDishawa,
        maruDishawa,
      },
      captionSnippet: caption.slice(0, 160) + "...",
      durationMs,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[AstroTharaka Cron] Fatal workflow execution error:", error);

    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
        timestampSLST: slstTimestamp,
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleDailyHoroscopeCron(req);
}

export async function POST(req: NextRequest) {
  return handleDailyHoroscopeCron(req);
}
