import { NextRequest, NextResponse } from "next/server";
import { getNextStatusImage } from "@/lib/status-images-manager";

export const dynamic = "force-dynamic";

const ZODIAC_SIGNS = [
  { symbol: "♈", si: "මේෂ", en: "Aries" },
  { symbol: "♉", si: "වෘෂභ", en: "Taurus" },
  { symbol: "♊", si: "මිථුන", en: "Gemini" },
  { symbol: "♋", si: "කටක", en: "Cancer" },
  { symbol: "♌", si: "සිංහ", en: "Leo" },
  { symbol: "♍", si: "කන්‍යා", en: "Virgo" },
  { symbol: "♎", si: "තුලා", en: "Libra" },
  { symbol: "♏", si: "වෘශ්චික", en: "Scorpio" },
  { symbol: "♐", si: "ධනු", en: "Sagittarius" },
  { symbol: "♑", si: "මකර", en: "Capricorn" },
  { symbol: "♒", si: "කුම්භ", en: "Aquarius" },
  { symbol: "♓", si: "මීන", en: "Pisces" },
];

function getRandomSigns(count: number): Array<{ symbol: string; si: string; en: string }> {
  const shuffled = [...ZODIAC_SIGNS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function formatSignsList(signs: Array<{ symbol: string; si: string }>): string {
  return signs.map((s) => `${s.symbol} ${s.si}`).join(", ");
}

const FREE_KENDARA_PROMO = [
  "🎁 ඔබේ කේන්දරය නොමිලේ බලාගන්න!",
  "ඔබේ උපන් දිනය, වේලාව සහ ස්ථානය අනුව සම්පූර්ණ කේන්දරය සහ ග්‍රහ පිහිටීම් දැන්ම නොමිලේ බලාගන්න:",
  "🌐 https://astrotharaka.com",
].join("\n");

type TimeSlot = "morning" | "afternoon" | "evening";

function detectTimeSlot(slstHour: number): TimeSlot {
  if (slstHour >= 6 && slstHour < 14) {
    return "morning"; // 10:00 AM
  } else if (slstHour >= 14 && slstHour < 18) {
    return "afternoon"; // 4:00 PM
  } else {
    return "evening"; // 7:00 PM
  }
}

interface StatusImageInfo {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  queuePosition?: number;
  remainingAfter?: number;
}

/**
 * Automatically get the next shuffled, one-time-use status image from public/brand/status-images
 */
function getStatusImage(slot: TimeSlot): StatusImageInfo | null {
  try {
    const nextImage = getNextStatusImage(slot);
    if (!nextImage) return null;
    return {
      buffer: nextImage.buffer,
      fileName: nextImage.fileName,
      mimeType: nextImage.mimeType,
      queuePosition: nextImage.queuePosition,
      remainingAfter: nextImage.remainingAfter,
    };
  } catch (err) {
    console.warn("[AstroStatus] Error retrieving next status image from queue:", err);
    return null;
  }
}

/**
 * High-quality, diverse engaging status generator with time-slot awareness and free kendara promo link
 */
function generateFallbackStatus(slot: TimeSlot): string {
  const morningTemplates = [
    () => {
      const signs = getRandomSigns(4);
      return [
        "🔮 ඉදිරි දින කිහිපය තුළ අනපේක්ෂිත සුබ ආරංචි, මූල්‍යමය වාසි හෝ රැකියා ජයග්‍රහණ ලැබීමට වැඩි ඉඩක් ඇති ලග්න 4ක්:",
        "",
        `✨ ${formatSignsList(signs)}`,
        "",
        "ග්‍රහ පිහිටීම්වල ධනාත්මක ශක්තිය ඔබට ජයග්‍රහණ ගෙන ඒමට සූදානම්! 🌟",
        "",
        "ඔබත් මේ ලග්නයක කෙනෙක්ද? 👇 ඔබේ ලග්නය Comment කරගෙන යන්න!",
        "",
        FREE_KENDARA_PROMO,
        "",
        "🌙 Astro Tharaka – තරු අතරින් ජීවිතය කියවමු!",
        "#AstroTharaka #AstrologyLK #LagnaPalapala #දෛනිකලග්නපලාපල",
      ].join("\n");
    },
    () => {
      const signs = getRandomSigns(3);
      return [
        "✨ කිසිදා බාධක හමුවේ නොසැලෙන, සිතූ දේ කෙසේ හෝ අත්පත් කරගන්නා නොපසුබස්නා අධිෂ්ඨානයක් හිමි ලග්න 3ක්:",
        "",
        `🔥 ${formatSignsList(signs)}`,
        "",
        "ඔබ සතු මේ නොපසුබස්නා ධෛර්යය ඔබේ ජීවිතයේ ලොකුම ශක්තියයි. 🌟",
        "",
        "මේ ගතිගුණ ඔබටත් තියෙනවද? ඔබේ ලග්නය Comment කරන්න! මේ ලග්නවල ඉන්න ඔබේ යාළුවන්වත් Tag කරන්න! 👇",
        "",
        FREE_KENDARA_PROMO,
        "",
        "🌙 Astro Tharaka",
        "#AstroTharaka #AstrologyLK #ZodiacSecrets",
      ].join("\n");
    },
    () => {
      const signs = getRandomSigns(4);
      return [
        "🌟 අද උදෑසන ග්‍රහ මණ්ඩලයේ බලපෑමෙන් විශේෂ ජවයක් සහ නායකත්ව හැකියාවක් ඉස්මතු වන ලග්න 4ක්:",
        "",
        `✨ ${formatSignsList(signs)}`,
        "",
        "අද ඔබ ආරම්භ කරන සුබ කටයුතුවලට ඉහළ සාර්ථකත්වයක් අත්විය හැක! 💫",
        "",
        "ඔබේ ලග්නයත් මෙතන තියෙනවද? Comment කර ඔබේ දවස ජයගන්න! 👇",
        "",
        FREE_KENDARA_PROMO,
        "",
        "🌙 Astro Tharaka – තරු අතරින් ජීවිතය කියවමු!",
        "#AstroTharaka #AstrologyLK #LagnaPalapala",
      ].join("\n");
    },
  ];

  const afternoonTemplates = [
    () => {
      const signs = getRandomSigns(4);
      return [
        "✨ ඉදිරි කාලයේදී නව ආයෝජන, ව්‍යාපාරික සාර්ථකත්වය සහ මුදල් ගලා ඒමේ වාසනාව විවර වන ලග්න 4ක්:",
        "",
        `💰 ${formatSignsList(signs)}`,
        "",
        "ඔබේ සැලසුම් සහ උත්සාහය නිවැරදිව පවත්වා ගන්න, වාසනාව ඔබේ පැත්තේ! 🌟",
        "",
        "ඔබේ ලග්නය මොකක්ද? 👇 Comment එකක් දාලා යන්න!",
        "",
        FREE_KENDARA_PROMO,
        "",
        "🌙 Astro Tharaka – තරු අතරින් ජීවිතය කියවමු!",
        "#AstroTharaka #AstrologyLK #LagnaPalapala",
      ].join("\n");
    },
    () => {
      const signs = getRandomSigns(3);
      return [
        "🌟 වචනයෙන් සහ පෞරුෂයෙන් ඕනෑම කෙනෙකුගේ සිත දිනාගැනීමේ අපූරු ආකර්ෂණයක් හා දක්ෂතාවයක් හිමි ලග්න 3ක්:",
        "",
        `💖 ${formatSignsList(signs)}`,
        "",
        "ඔබේ සිනහව සහ කාරුණික බව ඔබ යන යන තැන ආලෝකමත් කරනවා! ✨",
        "",
        "ඔබේ ලග්නයත් මෙතන තියෙනවද? මේ ලග්නවල ඉන්න ඔබේ ආදරණීය යාළුවන්ව Tag කරන්න! 👇",
        "",
        FREE_KENDARA_PROMO,
        "",
        "🌙 Astro Tharaka",
        "#AstroTharaka #AstrologyLK #ZodiacFacts",
      ].join("\n");
    },
    () => {
      const signs = getRandomSigns(4);
      return [
        "🔮 හවස් කාලයේ ග්‍රහ චලිතයන් අනුව අනපේක්ෂිත හමුවීම් සහ සබඳතා අලුත් වන ලග්න 4ක්:",
        "",
        `✨ ${formatSignsList(signs)}`,
        "",
        "අද හවස ඔබේ සිතට ප්‍රීතිමත් ආරංචියක් හෝ සැනසිලිදායක පණිවිඩයක් ලැබිය හැක! 🌟",
        "",
        "ඔබේ ලග්නය Comment කර සුබ ප්‍රාර්ථනා එක්කරන්න! 👇",
        "",
        FREE_KENDARA_PROMO,
        "",
        "🌙 Astro Tharaka – තරු අතරින් ජීවිතය කියවමු!",
        "#AstroTharaka #AstrologyLK #SriLanka",
      ].join("\n");
    },
  ];

  const eveningTemplates = [
    () => {
      const signs = getRandomSigns(4);
      return [
        "🔮 තමන්ගේ හයවන ඉන්ද්‍රිය (Intuition) සහ ඕනෑම පුද්ගලයෙකු හෝ සිදුවීමක් ක්ෂණිකව වටහාගැනීමේ අපූරු හැකියාවක් ඇති ලග්න 4ක්:",
        "",
        `✨ ${formatSignsList(signs)}`,
        "",
        "ඔබටත් කලින් හිතෙන දේවල් ඒ විදියටම ඇත්ත වෙලා තියෙනවද? 🌟",
        "",
        "ඔබේ ලග්නය මොකක්ද කියලා පහළින් Comment කර අත්දැකීම් බෙදාගන්න! 👇",
        "",
        FREE_KENDARA_PROMO,
        "",
        "🌙 Astro Tharaka – තරු අතරින් ජීවිතය කියවමු!",
        "#AstroTharaka #AstrologyLK #SinhalaAstrology",
      ].join("\n");
    },
    () => {
      const signs = getRandomSigns(3);
      return [
        "🔮 කොච්චර ප්‍රශ්න ආවත් සිතේ සැනසීම හා සාමය නැති කර නොගන්නා සැබෑම ඉවසීමක් හිමි ලග්න 3ක්:",
        "",
        `🌿 ${formatSignsList(signs)}`,
        "",
        "සැබෑ ජයග්‍රහණය රැඳෙන්නේ ඔබේ මේ ඉවසීම හා බුද්ධිමත් බව තුළයි! ✨",
        "",
        "මේ ලග්නවල ඉන්න ඔබේ හිතවතුන්ව Tag කරන්න! ඔබේ ලග්නයත් Comment කරන්න! 👇",
        "",
        FREE_KENDARA_PROMO,
        "",
        "🌙 Astro Tharaka",
        "#AstroTharaka #AstrologyLK #PeacefulMinds",
      ].join("\n");
    },
    () => {
      const signs = getRandomSigns(4);
      return [
        "🌟 ග්‍රහ පිහිටීම්වල බලපෑමත් සමඟ ඉදිරි දිනවලදී ආදරය, විවාහය සහ පවුල් ජීවිතයේ සතුට දෙගුණ තෙගුණ වන ලග්න 4ක්:",
        "",
        `❤️ ${formatSignsList(signs)}`,
        "",
        "ඔබේ සමීපතමයන් සමඟ ආදරයෙන් කාලය ගත කරන්න! ✨",
        "",
        "ඔබේ ලග්නයත් මෙතන තියෙනවද? Comment කරන්න, ඔබේ සහකරුවාව හෝ සහකාරියව Tag කරන්න! 👇",
        "",
        FREE_KENDARA_PROMO,
        "",
        "🌙 Astro Tharaka – තරු අතරින් ජීවිතය කියවමු!",
        "#AstroTharaka #AstrologyLK #LoveHoroscope",
      ].join("\n");
    },
  ];

  let pool = morningTemplates;
  if (slot === "afternoon") pool = afternoonTemplates;
  if (slot === "evening") pool = eveningTemplates;

  const pick = pool[Math.floor(Math.random() * pool.length)];
  return pick();
}

/**
 * Generate via Gemini AI if available
 */
async function generateAiStatus(slot: TimeSlot): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;

  const candidateModels = [
    "gemini-3.8-flash",
    process.env.GEMINI_MODEL?.trim(),
    "gemini-flash-latest",
  ].filter((m): m is string => Boolean(m) && m !== "gemini-2.5-flash");

  const signs = getRandomSigns(Math.random() > 0.5 ? 4 : 3);
  const selectedSignsText = signs.map((s) => `${s.symbol} ${s.si} (${s.en})`).join(", ");

  const slotDescriptions = {
    morning: "10:00 AM audience (inspiring, fresh energy, upcoming lucky chances)",
    afternoon: "4:00 PM audience (work/business reflection, financial opportunities, personality strengths)",
    evening: "7:00 PM audience (evening relaxation, love, relationships, intuition, tomorrow's mindset)",
  };

  const prompt = [
    "Act as an expert Sri Lankan Astrology content creator for the brand 'Astro Tharaka'.",
    `Generate a short, captivating Facebook status caption in natural Sinhala for ${slotDescriptions[slot]}.`,
    "Guidelines:",
    "- Keep it engaging, mysterious, encouraging, and positive.",
    `- Mention these specific zodiac signs to create excitement: ${selectedSignsText}.`,
    "- Use relevant emojis (✨, 🔮, 🌟).",
    "- Add a Call-to-Action (CTA) asking users to comment their zodiac sign or tag a friend.",
    "",
    "MANDATORY REQUIREMENT:",
    "Always include this EXACT free horoscope call-to-action block before the brand/hashtags:",
    "🎁 ඔබේ කේන්දරය නොමිලේ බලාගන්න!",
    "ඔබේ උපන් දිනය, වේලාව සහ ස්ථානය අනුව සම්පූර්ණ කේන්දරය සහ ග්‍රහ පිහිටීම් දැන්ම නොමිලේ බලාගන්න:",
    "🌐 https://astrotharaka.com",
    "",
    "- End with brand line '🌙 Astro Tharaka – තරු අතරින් ජීවිතය කියවමු!' and 2-3 hashtags (#AstroTharaka #AstrologyLK #LagnaPalapala).",
    "- Output ONLY the final Sinhala status text. No markdown fences, no English explanation.",
  ].join("\n");

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!res.ok) continue;

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text && text.length > 50) {
        let cleanText = text.replace(/```[a-z]*\n?/gi, "").trim();
        // Ensure https://astrotharaka.com is present
        if (!cleanText.includes("https://astrotharaka.com")) {
          cleanText = cleanText + "\n\n" + FREE_KENDARA_PROMO;
        }
        return cleanText;
      }
    } catch {
      // try next model
    }
  }

  return null;
}

/**
 * Publish status with rotating photo (or fallback to text) to Facebook Page Feed
 */
async function publishToFacebook(
  message: string,
  imageInfo: StatusImageInfo | null
): Promise<{
  status: string;
  postId: string | null;
  postType: "PHOTO" | "TEXT";
  imageUsed: string | null;
  error?: string;
}> {
  const pageId = process.env.FACEBOOK_PAGE_ID?.trim();
  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();
  const postingEnabled =
    (process.env.FACEBOOK_POSTING_ENABLED ?? "true").toLowerCase().trim() !== "false";

  if (!postingEnabled) {
    return {
      status: "DISABLED",
      postId: null,
      postType: imageInfo ? "PHOTO" : "TEXT",
      imageUsed: imageInfo?.fileName || null,
      error: "FACEBOOK_POSTING_ENABLED=false",
    };
  }

  if (!pageId || !pageToken) {
    return {
      status: "SKIPPED",
      postId: null,
      postType: imageInfo ? "PHOTO" : "TEXT",
      imageUsed: imageInfo?.fileName || null,
      error: "Missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN in env",
    };
  }

  const targetEndpoint =
    !pageId || pageId.toLowerCase() === "me" ? "me" : encodeURIComponent(pageId);

  if (!imageInfo) {
    return {
      status: "FAILED_NO_PHOTO",
      postId: null,
      postType: "PHOTO",
      imageUsed: null,
      error: "Photo required: Cannot publish status without an image photo",
    };
  }

  // Upload as Photo Post only (Text-only fallback is strictly prohibited)
  try {
    const postPhoto = async (endpoint: string) => {
      const formData = new FormData();
      formData.append("caption", message);
      formData.append("access_token", pageToken);
      const blob = new Blob([new Uint8Array(imageInfo.buffer)], { type: imageInfo.mimeType });
      formData.append("source", blob, imageInfo.fileName);

      return fetch(`https://graph.facebook.com/v19.0/${endpoint}/photos`, {
        method: "POST",
        body: formData,
      });
    };

    let response = await postPhoto(targetEndpoint);
    let data = (await response.json()) as { id?: string; error?: { message?: string } };

    if (
      !response.ok &&
      targetEndpoint !== "me" &&
      data?.error?.message?.toLowerCase().includes("global id")
    ) {
      response = await postPhoto("me");
      data = (await response.json()) as { id?: string; error?: { message?: string } };
    }

    if (response.ok && data?.id) {
      return {
        status: "SUCCESS",
        postId: data.id,
        postType: "PHOTO",
        imageUsed: imageInfo.fileName,
      };
    }

    const errMsg = data?.error?.message || `HTTP ${response.status}`;
    console.warn(`[AstroStatus] Photo upload rejected: ${errMsg}`);
    return {
      status: `FAILED: ${errMsg}`,
      postId: null,
      postType: "PHOTO",
      imageUsed: imageInfo.fileName,
      error: errMsg,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn("[AstroStatus] Photo upload exception:", err);
    return {
      status: `FAILED: ${errMsg}`,
      postId: null,
      postType: "PHOTO",
      imageUsed: imageInfo.fileName,
      error: errMsg,
    };
  }
}

async function handleMiddayStatusCron(req: NextRequest) {
  const startTime = Date.now();

  // Authentication: Check x-cron-secret or Bearer or query secret
  const cronHeader = req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const configuredSecret =
    process.env.CRON_SECRET || "taraka_cron_secret_secure_key_2026";

  const isAuthorized =
    cronHeader === configuredSecret ||
    querySecret === configuredSecret ||
    authHeader === `Bearer ${configuredSecret}` ||
    req.headers.get("user-agent")?.includes("vercel-cron");

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing cron secret authorization" },
      { status: 401 }
    );
  }

  // Detect time slot (from query or current SLST time)
  const slotParam = req.nextUrl.searchParams.get("slot") as TimeSlot | null;
  const nowUtc = new Date();
  const slstTime = new Date(nowUtc.getTime() + 5.5 * 60 * 60 * 1000);
  const slstHour = slstTime.getUTCHours();
  const slot: TimeSlot = slotParam || detectTimeSlot(slstHour);

  // Generate engaging status text (AI first, fallback if unavailable)
  let statusText = await generateAiStatus(slot);
  let generatedBy = "gemini-ai";

  if (!statusText) {
    statusText = generateFallbackStatus(slot);
    generatedBy = "local-template-engine";
  }

  // Find image from public/brand/status-images
  const imageInfo = getStatusImage(slot);

  // Publish to Facebook (Photo post if image found, else Text post)
  const fbResult = await publishToFacebook(statusText, imageInfo);

  const durationMs = Date.now() - startTime;

  return NextResponse.json({
    success: fbResult.status === "SUCCESS",
    slot,
    generatedBy,
    postType: fbResult.postType,
    imageUsed: fbResult.imageUsed,
    queuePosition: imageInfo?.queuePosition ?? null,
    remainingAfter: imageInfo?.remainingAfter ?? null,
    statusText,
    facebook: fbResult,
    durationMs,
  });
}

export async function GET(req: NextRequest) {
  return handleMiddayStatusCron(req);
}

export async function POST(req: NextRequest) {
  return handleMiddayStatusCron(req);
}
