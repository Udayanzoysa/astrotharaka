import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

function getBannerBuffer(): Buffer | null {
  const possiblePaths = [
    path.join(process.cwd(), "public/brand/daily-horoscope-banner.jpg"),
    path.join(process.cwd(), "apps/web/public/brand/daily-horoscope-banner.jpg"),
    "/app/apps/web/public/brand/daily-horoscope-banner.jpg",
    "/app/public/brand/daily-horoscope-banner.jpg",
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        return fs.readFileSync(p);
      } catch {
        // ignore
      }
    }
  }
  return null;
}

function buildSinhalaDailyPost(horoscopeData: HoroscopeRecord, slstDateStr: string): string {
  const dateDisplay =
    (typeof horoscopeData.dateDisplay === "object"
      ? horoscopeData.dateDisplay?.si
      : horoscopeData.dateDisplay) || slstDateStr;

  const lines: string[] = [
    "🌟🔮 අද දවස ඔබේ ලග්නයට කොහොමද?",
    `📅 ${dateDisplay}`,
    "✨ ආදරය, රැකියාව, මුදල් සහ ජීවිතයේ කටයුතු ගැන අද දවසේ ලග්න පලාපල මෙන්න!",
    "",
  ];

  const rawList =
    (horoscopeData as Record<string, unknown>).lagnaPredictions ??
    (horoscopeData as Record<string, unknown>).predictions ??
    [];

  let parsedList: unknown = rawList;
  if (typeof rawList === "string") {
    try {
      parsedList = JSON.parse(rawList);
    } catch {
      parsedList = [];
    }
  }

  const predictionsList = Array.isArray(parsedList)
    ? (parsedList as Array<Record<string, unknown>>)
    : [];

  const defaultLagnas: Array<{
    code: string;
    symbol: string;
    nameSi: string;
    fallbackPrediction: string;
    fallbackColor: string;
    fallbackNumber: string;
  }> = [
    {
      code: "aries",
      symbol: "♈",
      nameSi: "මේෂ",
      fallbackPrediction: "රැකියා සහ ව්‍යාපාර කටයුතුවල අලුත් උනන්දුවක් ඇතිවිය හැකියි. ප්‍රමාද වූ වැඩ අවසන් කිරීමට උත්සාහ කරන්න. හදිසි තීරණ සහ අනවශ්‍ය වියදම්වලින් වළකින්න.",
      fallbackColor: "රතු",
      fallbackNumber: "09",
    },
    {
      code: "taurus",
      symbol: "♉",
      nameSi: "වෘෂභ",
      fallbackPrediction: "ඉවසීමෙන් වැඩ කිරීමෙන් යහපත් ප්‍රතිඵල ලබාගත හැකියි. පවුලේ සමගියට මුල් තැන දෙන්න. ආදායමෙන් කොටසක් ඉතිරි කිරීමට සුදුසු දිනයක්.",
      fallbackColor: "සුදු",
      fallbackNumber: "06",
    },
    {
      code: "gemini",
      symbol: "♊",
      nameSi: "මිථුන",
      fallbackPrediction: "අලුත් සබඳතා සහ අදහස් ඔබට ප්‍රයෝජනවත් විය හැකියි. රැකියාවේදී අදහස් පැහැදිලිව ඉදිරිපත් කරන්න. එකවර වැඩ රැසක් ආරම්භ කිරීමෙන් වළකින්න.",
      fallbackColor: "කොළ",
      fallbackNumber: "05",
    },
    {
      code: "cancer",
      symbol: "♋",
      nameSi: "කටක",
      fallbackPrediction: "පවුලේ වගකීම් වෙනුවෙන් වැඩි අවධානයක් යොමු කිරීමට සිදුවිය හැකියි. සමීප අය සමඟ සුහදව කටයුතු කරන්න. මුදල් ගනුදෙනුවලදී සැලකිලිමත් වන්න.",
      fallbackColor: "සුදු",
      fallbackNumber: "02",
    },
    {
      code: "leo",
      symbol: "♌",
      nameSi: "සිංහ",
      fallbackPrediction: "නායකත්ව ගුණාංග විදහා දැක්වීමට අවස්ථාව සැලසේ. ආත්ම විශ්වාසයෙන් වැඩකටයුතු කරන්න. අන්‍යන්ගේ අදහස්වලටද ගරු කරන්න.",
      fallbackColor: "රන්වන් කහ",
      fallbackNumber: "01",
    },
    {
      code: "virgo",
      symbol: "♍",
      nameSi: "කන්‍යා",
      fallbackPrediction: "සැලසුම් සහගතව කටයුතු කිරීමෙන් බලාපොරොත්තු ඉටු වේ. විස්තරාත්මක කාර්යයන් සාර්ථකව නිම කළ හැක. අධික විවේචනයෙන් වළකින්න.",
      fallbackColor: "කොළ",
      fallbackNumber: "05",
    },
    {
      code: "libra",
      symbol: "♎",
      nameSi: "තුලා",
      fallbackPrediction: "හවුල් ව්‍යාපාර සහ සබඳතා වඩාත් ශක්තිමත් වේ. සාමකාමී පරිසරයක සිත සැහැල්ලුවෙන් තබාගන්න. මූල්‍ය තීරණ සමබරව ගන්න.",
      fallbackColor: "ලා නිල්",
      fallbackNumber: "06",
    },
    {
      code: "scorpio",
      symbol: "♏",
      nameSi: "වෘශ්චික",
      fallbackPrediction: "සැඟවුණු හැකියාවන් ඉස්මතු වන දිනයකි. නොසැලෙන අධිෂ්ඨානයෙන් බාධක ජයගත හැක. ඉක්මන් කෝපය පාලනය කරගන්න.",
      fallbackColor: "තද රතු",
      fallbackNumber: "09",
    },
    {
      code: "sagittarius",
      symbol: "♐",
      nameSi: "ධනු",
      fallbackPrediction: "නව ඉගෙනුම් හා ගමන් බිමන්වලට සුබයි. දූරදර්ශී අදහස් තුළින් සාර්ථකත්වය අත්වේ. අධික වියදම් සීමා කරන්න.",
      fallbackColor: "කහ",
      fallbackNumber: "03",
    },
    {
      code: "capricorn",
      symbol: "♑",
      nameSi: "මකර",
      fallbackPrediction: "වෘත්තීය ඉලක්ක සපුරාගැනීමට කැපවීම ප්‍රයෝජනවත් වේ. ඉවසීමෙන් කටයුතු කරන්න. වැඩිහිටියන්ගේ අවවාද පිළිපදින්න.",
      fallbackColor: "තද නිල්",
      fallbackNumber: "08",
    },
    {
      code: "aquarius",
      symbol: "♒",
      nameSi: "කුම්භ",
      fallbackPrediction: "නව අදහස් හා නවෝත්පාදන තුළින් සමාජයේ ප්‍රසාදය ලැබේ. මිතුරු ඇසුරින් උපකාර හිමිවේ. අනවශ්‍ය කරදරවලට මැදි නොවන්න.",
      fallbackColor: "අළු හෝ නිල්",
      fallbackNumber: "08",
    },
    {
      code: "pisces",
      symbol: "♓",
      nameSi: "මීන",
      fallbackPrediction: "අධ්‍යාත්මික සහන හා මනසේ සතුට වර්ධනය වේ. නිර්මාණශීලී කටයුතුවලින් ප්‍රතිඵල ලැබේ. ප්‍රායෝගිකව තීරණ ගන්න.",
      fallbackColor: "කහ",
      fallbackNumber: "03",
    },
  ];

  const extractText = (f: unknown): string => {
    if (!f) return "";
    if (typeof f === "string") return f.trim();
    if (typeof f === "object" && f !== null) {
      const obj = f as Record<string, unknown>;
      return (
        (typeof obj.si === "string" ? obj.si : "") ||
        (typeof obj.en === "string" ? obj.en : "") ||
        (typeof obj.ta === "string" ? obj.ta : "") ||
        ""
      ).trim();
    }
    return "";
  };

  for (const def of defaultLagnas) {
    const p = predictionsList.find((it) => {
      if (!it || typeof it !== "object") return false;
      return (
        it.code === def.code ||
        it.lagnaKey === def.code ||
        it.nameSi === def.nameSi ||
        it.lagnaName === def.nameSi
      );
    });

    const symbol = (p?.symbol as string) || def.symbol;
    const nameSi = (p?.nameSi as string) || (p?.lagnaName as string) || def.nameSi;

    const summaryText = extractText(p?.summary);
    const careerText = extractText(p?.career);
    const wealthText = extractText(p?.wealth);

    let prediction = summaryText;
    if (!prediction || prediction.length < 35) {
      const parts = [summaryText, careerText, wealthText].filter(Boolean);
      prediction = parts.length > 0 ? parts.join(" ") : def.fallbackPrediction;
    }
    if (!prediction || prediction.length < 15) {
      prediction = def.fallbackPrediction;
    }

    const luckyColor = extractText(p?.luckyColor) || def.fallbackColor;
    let luckyNumber = extractText(p?.luckyNumber) || def.fallbackNumber;
    if (luckyNumber.length === 1) {
      luckyNumber = `0${luckyNumber}`;
    }

    let colorDot = "🔴";
    if (luckyColor.includes("සුදු")) colorDot = "⚪";
    else if (luckyColor.includes("කොළ")) colorDot = "🟢";
    else if (luckyColor.includes("කහ") || luckyColor.includes("රන්වන්")) colorDot = "🟡";
    else if (luckyColor.includes("නිල්")) colorDot = "🔵";
    else if (luckyColor.includes("තැඹිලි")) colorDot = "🟠";
    else if (luckyColor.includes("දම්")) colorDot = "🟣";
    else if (luckyColor.includes("රතු")) colorDot = "🔴";

    lines.push(`${symbol} ${nameSi} ලග්නය`);
    lines.push(prediction);
    lines.push(`${colorDot} සුබ වර්ණය: ${luckyColor}`);
    lines.push(`🔢 ජය අංකය: ${luckyNumber}`);
    lines.push("");
  }

  lines.push("🎁🔮 ඔබේ කේන්දරය නොමිලේ බලාගන්න!");
  lines.push("ඔබේ උපන් දිනය, වේලාව සහ ස්ථානය අනුව කේන්දරය සහ ග්‍රහ පිහිටීම් ගැන දැනගන්න.");
  lines.push("🌐 https://astrotharaka.com");
  lines.push("");
  lines.push("💬 ඔබේ ලග්නය මොකක්ද? ♈♉♊");
  lines.push("👇 Comment කරන්න! ඔබේ ලග්නයට අද දවසේ පලාපල ගැළපෙනවාද කියලත් අපට කියන්න. ❤️");
  lines.push("");
  lines.push("🌙 Astro Tharaka – තරු අතරින් ජීවිතය කියවමු! ✨");
  lines.push(
    "#AstroTharaka #DailyHoroscope #AstrologyLK #LagnaPalapala #SinhalaAstrology #ජ්‍යෝතිෂය #අදලග්නපලාපල #කේන්දරය #SriLanka"
  );

  return lines.join("\n");
}

interface MultilingualString {
  si?: string;
  en?: string;
  ta?: string;
}

interface HoroscopeRecord {
  dateDisplay?: string | MultilingualString;
  generalNotes?: string | MultilingualString;
  socialPost?: string | MultilingualString;
  panchanga?: {
    rahuKalaya?: string | MultilingualString;
    subaDishawa?: string | MultilingualString;
    maruDishawa?: string | MultilingualString;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface FacebookPostResponse {
  id?: string;
  error?: {
    message?: string;
    code?: number;
    type?: string;
  };
}

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
    let horoscopeData: HoroscopeRecord | null = null;

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
      (typeof horoscopeData.dateDisplay === "object"
        ? horoscopeData.dateDisplay?.si
        : horoscopeData.dateDisplay) || slstDateStr;

    const rahuKalaya =
      (typeof horoscopeData.panchanga?.rahuKalaya === "object"
        ? horoscopeData.panchanga.rahuKalaya?.si
        : (horoscopeData.panchanga?.rahuKalaya as string | undefined)) || "පෙ.ව. 09:00 - 10:30";

    const subaDishawa =
      (typeof horoscopeData.panchanga?.subaDishawa === "object"
        ? horoscopeData.panchanga.subaDishawa?.si
        : (horoscopeData.panchanga?.subaDishawa as string | undefined)) || "උතුර";

    const maruDishawa =
      (typeof horoscopeData.panchanga?.maruDishawa === "object"
        ? horoscopeData.panchanga.maruDishawa?.si
        : (horoscopeData.panchanga?.maruDishawa as string | undefined)) || "නැගෙනහිර";

    // 4. Construct Engaging Sinhala Caption Text for Facebook (matches custom template)
    const caption = buildSinhalaDailyPost(horoscopeData, slstDateStr);

    // 5. Social Media Publishing (Facebook Graph API - Banner Photo with Caption)
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
      console.log(`[AstroTharaka Cron] Publishing daily banner photo to Facebook Page ${pageId}...`);

      const targetEndpoint =
        !pageId || pageId.toLowerCase() === "me"
          ? "me"
          : encodeURIComponent(pageId);

      const bannerBuffer = getBannerBuffer();
      const publicBannerUrl = `${process.env.WEB_APP_URL || "https://astrotharaka.com"}/brand/daily-horoscope-banner.jpg`;

      const postWithPhoto = async (endpoint: string): Promise<Response> => {
        if (bannerBuffer) {
          const formData = new FormData();
          formData.append("caption", caption);
          formData.append("access_token", pageToken);
          const blob = new Blob([new Uint8Array(bannerBuffer)], { type: "image/jpeg" });
          formData.append("source", blob, "daily-horoscope-banner.jpg");
          return fetch(`https://graph.facebook.com/v19.0/${endpoint}/photos`, {
            method: "POST",
            body: formData,
          });
        }
        return fetch(`https://graph.facebook.com/v19.0/${endpoint}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: publicBannerUrl,
            caption: caption,
            access_token: pageToken,
          }),
        });
      };

      let fbResponse = await postWithPhoto(targetEndpoint);
      let fbData = (await fbResponse.json()) as FacebookPostResponse;

      // If global ID error (#100) occurs, fallback automatically to /me/photos
      if (!fbResponse.ok && targetEndpoint !== "me" && fbData?.error?.message?.toLowerCase().includes("global id")) {
        console.warn("[AstroTharaka Cron] Direct page ID rejected as global ID. Retrying with /me/photos...");
        fbResponse = await postWithPhoto("me");
        fbData = (await fbResponse.json()) as FacebookPostResponse;
      }

      // If photo post fails, fallback to feed text post
      if (!fbResponse.ok && (fbResponse.status === 400 || fbResponse.status === 403)) {
        console.warn("[AstroTharaka Cron] Photo post failed, falling back to /feed text post:", fbData?.error?.message);
        fbResponse = await fetch(`https://graph.facebook.com/v19.0/${targetEndpoint}/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: caption,
            access_token: pageToken,
          }),
        });
        fbData = (await fbResponse.json()) as FacebookPostResponse;
        if (!fbResponse.ok && targetEndpoint !== "me" && fbData?.error?.message?.toLowerCase().includes("global id")) {
          fbResponse = await fetch("https://graph.facebook.com/v19.0/me/feed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: caption,
              access_token: pageToken,
            }),
          });
          fbData = (await fbResponse.json()) as FacebookPostResponse;
        }
      }

      if (!fbResponse.ok) {
        fbError = fbData?.error?.message || `Facebook API HTTP ${fbResponse.status}`;
        fbStatus = `FAILED: ${fbError}`;
        console.error(`[AstroTharaka Cron] Facebook post failed:`, fbError);
      } else {
        fbPostId = fbData.id || null;
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
