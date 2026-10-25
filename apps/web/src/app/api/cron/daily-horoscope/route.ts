import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const DAY_BANNER_NAMES: Record<number, string> = {
  0: "banner-sunday.jpg",
  1: "banner-monday.jpg",
  2: "banner-tuesday.jpg",
  3: "banner-wednesday.jpg",
  4: "banner-thursday.jpg",
  5: "banner-friday.jpg",
  6: "banner-saturday.jpg",
};

function getBannerBuffer(dayOfWeek?: number): { buffer: Buffer; fileName: string } | null {
  const bannerFileName =
    typeof dayOfWeek === "number" && DAY_BANNER_NAMES[dayOfWeek]
      ? DAY_BANNER_NAMES[dayOfWeek]
      : "daily-horoscope-banner.jpg";

  const candidateDirs = [
    path.join(process.cwd(), "public/brand/banners"),
    path.join(process.cwd(), "apps/web/public/brand/banners"),
    "/app/apps/web/public/brand/banners",
    "/app/public/brand/banners",
    path.join(process.cwd(), "public/brand"),
    path.join(process.cwd(), "apps/web/public/brand"),
    "/app/apps/web/public/brand",
    "/app/public/brand",
  ];

  // 1. Try day-specific banner
  for (const dir of candidateDirs) {
    const filePath = path.join(dir, bannerFileName);
    if (fs.existsSync(filePath)) {
      try {
        return { buffer: fs.readFileSync(filePath), fileName: bannerFileName };
      } catch {
        // ignore
      }
    }
  }

  // 2. Fallback to default daily-horoscope-banner.jpg
  for (const dir of candidateDirs) {
    const fallbackPath = path.join(dir, "daily-horoscope-banner.jpg");
    if (fs.existsSync(fallbackPath)) {
      try {
        return { buffer: fs.readFileSync(fallbackPath), fileName: "daily-horoscope-banner.jpg" };
      } catch {
        // ignore
      }
    }
  }

  return null;
}


interface DaySpecificTheme {
  greeting: string;
  intro: string;
  thought: string;
  wish: string;
}

const DAY_SPECIFIC_THEMES: Record<number, DaySpecificTheme[]> = {
  // 0: Sunday (ඉරිදා) - Relaxation, family, gratitude, positivity, preparation for coming week
  0: [
    {
      greeting: "සුබ ඉරිදා දිනයක් වේවා!",
      intro: "පවුලේ ආදරණීයයන් සමඟ සතුටින් කාලය ගත කරමින් මනස සැහැල්ලු කරගන්න අද ඔබට හොඳම දිනයකි. ලැබූ විවේකය තුළින් නව සතියකට අවශ්‍ය ධනාත්මක ශක්තිය හා ප්‍රබෝධය සිතට එක්කර ගන්න.",
      thought: "සිත නිදහස් කරගන්නා මොහොතක් තුළින් ජීවිතයට අලුත් බලාපොරොත්තු රාශියක් උපදී.",
      wish: "පවුලේ සැමට සාමය, සතුට පිරි සුන්දර ඉරිදා දිනයක් වේවා!",
    },
    {
      greeting: "සැනසිලිදායක, සුන්දර ඉරිදා දිනයක් වේවා!",
      intro: "කාර්යබහුලත්වයෙන් මිදී සිතට සැනසීම ළඟා කරගන්නා සුන්දර දිනයක් අද උදා වී තිබේ. අද දවසේ සුළු මොහොතක් හෝ ඔබේ සතුට හා පවුලේ සැනසීම වෙනුවෙන් වෙන් කරන්න.",
      thought: "සැබෑ සතුට රැඳී ඇත්තේ නිහඬ සැනසීම සහ ආදරණීය බැඳීම් තුළයි.",
      wish: "සැනසිලිදායක සිතුවිලි පිරි ප්‍රීතිමත් ඉරිදා දිනයක් වේවා!",
    },
    {
      greeting: "ප්‍රීතිමත් ඉරිදා උදෑසනක් වේවා!",
      intro: "ගත වූ දිනවල අත්දැකීම් අගය කරමින්, සිතේ සන්සුන් බව රඳවා ගැනීමට ඉඩ සලසා ගන්න. නිස්කලංක මනසක් තුළින් අනාගතය දෙස වඩාත් පැහැදිලිව හා බලාපොරොත්තු සහගතව බැලිය හැක.",
      thought: "විවේකය යනු කම්මැලිවීම නොව, නව ජවයකින් නැවත නැගී සිටීමට මනස සූදානම් කරගැනීමයි.",
      wish: "නව සතියකට ආශීර්වාද එක්වන සුබ ඉරිදා දිනයක් වේවා!",
    },
  ],
  // 1: Monday (සඳුදා) - Welcome beginning of new week, fresh starts, new goals, hope and confidence
  1: [
    {
      greeting: "සුබ නව සතියක ආරම්භයක් වේවා!",
      intro: "අලුත් බලාපොරොත්තු සහ නැවුම් ඉලක්ක සමඟින් අද නව සතියක් ආරම්භ වේ. ඔබේ සිහින ජයගැනීමට නව ජවයකින් හා නොසැලෙන ආත්ම විශ්වාසයෙන් යුතුව අද දවස අරඹන්න.",
      thought: "සෑම නව ආරම්භයක්ම අලුත් අවස්ථාවන් රැගෙන එයි; ධෛර්යයෙන් ඉදිරියට යන ඔබට ජය නියතයි.",
      wish: "ඔබ සැමට සාර්ථක, සතුට සපිරි නව සතියක් වේවා!",
    },
    {
      greeting: "ප්‍රබෝධමත් සුබ සඳුදා දිනයක් වේවා!",
      intro: "නව සතියක උදාව ඔබේ ජීවිතයට අලුත් අවස්ථාවන් සහ ආශීර්වාද රැගෙන එනු ඇත. පියවරෙන් පියවර ඔබේ අරමුණු කරා ළඟාවීමට අද දවසේ මනස ධනාත්මකව තබාගන්න.",
      thought: "ඔබ තබන සෑම කුඩා ධනාත්මක පියවරක්ම විශිෂ්ට ජයග්‍රහණයක ආරම්භය විය හැක.",
      wish: "ඉලක්ක සපිරෙන ජයග්‍රාහී සුබ සඳුදා දිනයක් වේවා!",
    },
    {
      greeting: "ජයග්‍රාහී නව සතියකට සුබ පැතුම්!",
      intro: "සෑම සඳුදාවකම ඇත්තේ අලුත් ආරම්භයක සුන්දරත්වයයි. පසුගිය අභියෝග අමතක කර නැවුම් බලාපොරොත්තුවකින් යුතුව ඔබේ සතියේ මුල් පියවර තබන්න.",
      thought: "ආත්ම විශ්වාසය යනු ඕනෑම අභියෝගයක් ජයගැනීමට මිනිසා සතු බලවත්ම ශක්තියයි.",
      wish: "නැවුම් බලාපොරොත්තු සැබෑ වන සුබ නව සතියක් වේවා!",
    },
  ],
  // 2: Tuesday (අඟහරුවාදා) - Courage, energy, determination, overcoming challenges
  2: [
    {
      greeting: "සුබ අඟහරුවාදා දිනයක් වේවා!",
      intro: "ජීවිතයට එන ඕනෑම අභියෝගයකට නොබියව මුහුණ දීමට අද දවසේ ශක්තිය සහ ධෛර්යය ඔබේ සිත තුළ ගොඩනගා ගන්න. නොසැලෙන අධිෂ්ඨානය ඔබේ ගමන පහසු කරනු ඇත.",
      thought: "අභියෝග යනු ඔබේ සැබෑ ශක්තිය හඳුනාගැනීමට ලැබෙන වටිනා අවස්ථාවන්ය.",
      wish: "බාධක ජයගන්නා ශක්තිමත්, ඵලදායී දිනයක් වේවා!",
    },
    {
      greeting: "ධෛර්යවන්ත සුබ අඟහරුවාදා දිනයක් වේවා!",
      intro: "සිතේ ඇති ශක්තිය ක්‍රියාවට නංවමින් බාධක මැදින් ඉදිරියට යන්න අද දවස සුදුසුය. කැපවීම සහ නොපසුබස්නා උත්සාහය තුළින් ඔබේ දවසේ කාර්යයන් සාර්ථක කරගන්න.",
      thought: "නොසැලෙන අධිෂ්ඨානයක් ඇති තැන ඕනෑම දුෂ්කර මාවතක් පහසු මාවතක් බවට පත්වේ.",
      wish: "ධෛර්යය හා ජයග්‍රහණය සපිරි සුබ අඟහරුවාදා දිනයක් වේවා!",
    },
    {
      greeting: "ජවය පිරි සුබ අඟහරුවාදා දිනයක් වේවා!",
      intro: "අභියෝග හමුවේ නොසැලී සිටින පුද්ගලයාට ජීවිතය සැමවිටම ජයග්‍රහණ උරුම කරදෙයි. පූර්ණ ශක්තියෙන් යුතුව අද දවසේ අරමුණු වෙනුවෙන් කැපවන්න.",
      thought: "ධෛර්යය යනු බිය නැතිවීම නොව, බිය මැද වුවද ඉදිරියට යාමට ඇති සූදානමයි.",
      wish: "නිරෝගී සුවය හා මානසික ශක්තිය පිරි දිනයක් වේවා!",
    },
  ],
  // 3: Wednesday (බදාදා) - Knowledge, smart decisions, patience, personal growth
  3: [
    {
      greeting: "සුබ බදාදා දිනයක් වේවා!",
      intro: "නුවණින් සහ බුද්ධිමත්ව තීරණ ගැනීමට අද දවස ඔබට මනා පිටුවහලක් වනු ඇත. ඉවසීමෙන් හා විමසිල්ලෙන් කරන සෑම කාර්යයක්ම ඔබේ පෞද්ගලික දියුණුවට මග පාදයි.",
      thought: "ඉවසීමෙන් හා නුවණින් ගන්නා නිවැරදි තීරණ ජීවිතය නිසැකවම යහපත් මාවතකට යොමු කරයි.",
      wish: "ඥානය හා සාර්ථකත්වය පිරි සුබ දිනයක් වේවා!",
    },
    {
      greeting: "ඥානවන්ත සුබ බදාදා දිනයක් වේවා!",
      intro: "සතියේ මැද දිනය වන අද, ඔබේ සැලසුම් නැවත විමසා බලා වඩාත් නිවැරදි මාවත තෝරාගැනීමට සුදුසු කාලයකි. බුද්ධියෙන් කරන කාර්යයන් සාර්ථක ප්‍රතිඵල ගෙනදෙයි.",
      thought: "දැනුම සහ අවබෝධය තුළින් ජීවිතයේ අසීරු ගැටලු පවා ඉතා සරලව විසඳාගත හැක.",
      wish: "නිවැරදි තීරණ තුළින් ජය ලබන සුබ බදාදා දිනයක් වේවා!",
    },
    {
      greeting: "ප්‍රඥාව සපිරි සුබ බදාදා දිනයක් වේවා!",
      intro: "අලුත් දැනුම ලබාගැනීමටත්, අන් අය සමඟ සුහදව සහයෝගයෙන් කටයුතු කිරීමටත් අද දවස යොදාගන්න. ඉවසිලිවන්ත බව ඔබේ ජීවිතයේ ලොකුම ශක්තියයි.",
      thought: "ඉවසීම යනු නිහඬව බලා සිටීම නොව, කාලෝචිතව නිවැරදි දෙය කිරීමේ කලාවයි.",
      wish: "සාමය හා මානසික පැහැදිලිකම පිරි සුබ දිනයක් වේවා!",
    },
  ],
  // 4: Thursday (බ්‍රහස්පතින්දා) - Gratitude, progress, opportunities, prosperity
  4: [
    {
      greeting: "සුබ බ්‍රහස්පතින්දා දිනයක් වේවා!",
      intro: "ඔබ අත්පත් කරගත් දේ ගැන කෘතඥ වෙමින්, ඉදිරි ජීවිතයට ලැබෙන නව අවස්ථා විවෘත මනසින් වැළඳගන්න. කැපවීමෙන් වැඩ කරන ඔබට සෞභාග්‍යය හා දියුණුව ළඟා වේ.",
      thought: "කෘතඥපූර්වක සිතක් ඇති තැනට සෑම විටම යහපත හා සෞභාග්‍යය ගලා එයි.",
      wish: "සෞභාග්‍යය හා ප්‍රගතිය සපිරි සුබ දිනයක් වේවා!",
    },
    {
      greeting: "සෞභාග්‍යමත් සුබ බ්‍රහස්පතින්දා දිනයක් වේවා!",
      intro: "ජීවිතයේ ප්‍රගතිය උදෙසා ලැබෙන සුබදායී අවස්ථා හඳුනාගෙන ඒවායින් උපරිම ප්‍රයෝජන ගැනීමට අද දවස ඔබට ආශීර්වාදයක් වනු ඇත. උදාර සිතුවිලි සිත තුළ රඳවාගන්න.",
      thought: "අවස්ථාවන් පැමිණෙන තෙක් නොසිට, ඔබේ උත්සාහයෙන්ම නව අවස්ථාවන් නිර්මාණය කරගන්න.",
      wish: "ආශීර්වාද හා සතුට පිරි සුබ බ්‍රහස්පතින්දා දිනයක් වේවා!",
    },
    {
      greeting: "ආශීර්වාද සපිරි සුබ බ්‍රහස්පතින්දා දිනයක් වේවා!",
      intro: "කෘතඥතාවයෙන් පිරි සිතක් ඇතිව අද දවස ගත කරන්න. ඔබේ හැකියාවන් කෙරෙහි විශ්වාසය තබා ඉදිරියට තබන සෑම පියවරකදීම යහපත් ප්‍රතිඵල අත්කරගත හැක.",
      thought: "සැබෑ ප්‍රගතිය යනු ඊයේට වඩා අද ඔබ තබන එක ධනාත්මක පියවරකි.",
      wish: "සිතූ පැතූ දේ සාර්ථක වන සුබ දිනයක් වේවා!",
    },
  ],
  // 5: Friday (සිකුරාදා) - Happiness, love, peace, appreciating achievements
  5: [
    {
      greeting: "සුබ සිකුරාදා දිනයක් වේවා!",
      intro: "සතිය පුරා ඔබ කළ කැපවීම් අගය කරමින්, සිතේ සාමය හා සතුට රඳවා ගැනීමට අද දවස යොදාගන්න. ආදරය සහ සුහදත්වය පිරි පරිසරයක් ඔබ අවට නිර්මාණය කරගන්න.",
      thought: "සිතේ සාමය සහ සතුට රැඳෙන්නේ අප අන් අයට දක්වන ආදරය හා කරුණාව තුළයි.",
      wish: "ආදරය, සතුට හා සාමය පිරි සුබ සිකුරාදා දිනයක් වේවා!",
    },
    {
      greeting: "සාමකාමී, සුන්දර සිකුරාදා දිනයක් වේවා!",
      intro: "වෙහෙසකර සතියක නිමාව සනිටුහන් කරමින් සිතට සැනසිලිදායක සිතුවිලි එක්කර ගැනීමට සුදුසුම දිනයකි. සතුට සහ සැනසීම ඔබේ සමීපතමයන් සමඟ බෙදාගන්න.",
      thought: "ජීවිතයේ සුන්දරම දේ නම් ආදරය, සතුට හා අභ්‍යන්තර සාමකාමී බවයි.",
      wish: "සැනසිලිදායක, ප්‍රීතිමත් සිකුරාදා දිනයක් වේවා!",
    },
    {
      greeting: "ආදරණීය සුබ සිකුරාදා දිනයක් වේවා!",
      intro: "සතිය තුළ අත්පත් කරගත් සාර්ථකත්වයන් ගැන සතුටු වෙමින් සති අන්තයට සැහැල්ලුවෙන් සූදානම් වන්න. කරුණාවන්ත සිතුවිලි ඔබේ දවස තවත් ආලෝකමත් කරනු ඇත.",
      thought: "සතුට සෙවිය යුත්තේ බාහිරින් නොව, අප තුළ ඇති යහපත් සිතුවිලි තුළිනි.",
      wish: "සති අන්තයට සතුට රැගෙන එන සුබ දිනයක් වේවා!",
    },
  ],
  // 6: Saturday (සෙනසුරාදා) - Discipline, persistence, personal development, balance
  6: [
    {
      greeting: "සුබ සෙනසුරාදා දිනයක් වේවා!",
      intro: "ජීවිතයේ සමබරතාවය ආරක්ෂා කරගනිමින් ඔබේ පෞද්ගලික දියුණුවට සහ අනාගත සැලසුම්වලට කාලය වෙන් කරන්න. විනය හා නොපසුබට උත්සාහය ඔබේ සිහින සැබෑ කරයි.",
      thought: "විනයගරුක බව සහ නොපසුබස්නා උත්සාහය අසීරු ඉලක්ක පවා පහසුවෙන් ජයග්‍රහණය කරවයි.",
      wish: "සැනසිලිදායක, අර්ථවත් සති අන්තයක ඇරඹුමක් වේවා!",
    },
    {
      greeting: "විනයගරුක සුබ සෙනසුරාදා දිනයක් වේවා!",
      intro: "සති අන්තයේ ආරම්භයත් සමඟ ඔබේ ජීවිතයේ ප්‍රමුඛතා නැවත හඳුනාගෙන, ආත්ම දමනය හා නොසැලෙන කැපවීමෙන් ඉදිරි කටයුතු සැලසුම් කරගැනීමට අද සුදුසු දිනයකි.",
      thought: "අද දවසේ ඔබ කරන සැලසුම් හෙට දවසේ ඔබේ ජයග්‍රහණයේ පදනම වේ.",
      wish: "ප්‍රතිඵලදායක, යහපත් සුබ සෙනසුරාදා දිනයක් වේවා!",
    },
    {
      greeting: "අර්ථවත් සුබ සෙනසුරාදා දිනයක් වේවා!",
      intro: "නොපසුබට උත්සාහයෙන් යුතුව තම අරමුණු වෙනුවෙන් වැඩ කරන අයට සාර්ථකත්වය හිමිවේ. ඔබේ කාලය ඵලදායීව හා අර්ථවත්ව ගත කරන්න.",
      thought: "කැපවීම සහ විනය ඇති මිනිසාට කිසිදු බාධකයක් ජයගත නොහැකි නොවේ.",
      wish: "සිතට ශක්තිය හා සැනසීම ගෙනෙන සුබ දිනයක් වේවා!",
    },
  ],
};

function buildSinhalaDailyPost(horoscopeData: HoroscopeRecord, slstDateStr: string): string {
  // Parse year, month, day to compute day-of-week and rotation index
  const [yearNum, monthNum, dayNum] = slstDateStr.split("-").map((v) => parseInt(v, 10) || 1);
  const parsedDate = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
  const dayOfWeek = parsedDate.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const dayOfMonth = dayNum;

  const dayVariants = DAY_SPECIFIC_THEMES[dayOfWeek] || DAY_SPECIFIC_THEMES[1];
  const variantIndex = (dayOfMonth + Math.floor(dayOfMonth / 7)) % dayVariants.length;
  const currentTheme = dayVariants[variantIndex];

  const lines: string[] = [
    "🌟 අද දවස ඔබේ ලග්නයට කොහොමද?",
    "",
    `🌸 ${currentTheme.greeting}`,
    "",
    currentTheme.intro,
    "",
    "✨ අද දවසේ සිතුවිල්ල",
    "",
    `“${currentTheme.thought}”`,
    "",
    "අලුත් දවසක් සමඟ ඔබේ ජීවිතයට මොන වගේ අවස්ථා සහ අභියෝග ඇති වේවිද?",
    "ආදරය, රැකියාව, අධ්යාපනය, මුදල්, ව්යාපාර සහ පවුල් ජීවිතය පිළිබඳ සාම්ප්රදායික ජ්යෝතිෂ අනාවැකි ඇසුරින් අද දවසේ ලග්න පලාපල මෙන්න.",
    "ඔබේ ලග්නයට අද දවස කොහොමද කියලා බලමු!",
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
    nameEn: string;
    fallbackPrediction: string;
    fallbackColor: string;
    fallbackNumber: string;
  }> = [
    {
      code: "aries",
      symbol: "♈",
      nameSi: "මේෂ",
      nameEn: "Aries",
      fallbackPrediction: "රැකියා සහ ව්‍යාපාර කටයුතුවල අලුත් උනන්දුවක් ඇතිවිය හැකියි. ප්‍රමාද වූ වැඩ අවසන් කිරීමට උත්සාහ කරන්න. හදිසි තීරණ සහ අනවශ්‍ය වියදම්වලින් වළකින්න.",
      fallbackColor: "රතු",
      fallbackNumber: "09",
    },
    {
      code: "taurus",
      symbol: "♉",
      nameSi: "වෘෂභ",
      nameEn: "Taurus",
      fallbackPrediction: "ඉවසීමෙන් වැඩ කිරීමෙන් යහපත් ප්‍රතිඵල ලබාගත හැකියි. පවුලේ සමගියට මුල් තැන දෙන්න. ආදායමෙන් කොටසක් ඉතිරි කිරීමට සුදුසු දිනයක්.",
      fallbackColor: "සුදු",
      fallbackNumber: "06",
    },
    {
      code: "gemini",
      symbol: "♊",
      nameSi: "මිථුන",
      nameEn: "Gemini",
      fallbackPrediction: "අලුත් සබඳතා සහ අදහස් ඔබට ප්‍රයෝජනවත් විය හැකියි. රැකියාවේදී අදහස් පැහැදිලිව ඉදිරිපත් කරන්න. එකවර වැඩ රැසක් ආරම්භ කිරීමෙන් වළකින්න.",
      fallbackColor: "කොළ",
      fallbackNumber: "05",
    },
    {
      code: "cancer",
      symbol: "♋",
      nameSi: "කටක",
      nameEn: "Cancer",
      fallbackPrediction: "පවුලේ වගකීම් වෙනුවෙන් වැඩි අවධානයක් යොමු කිරීමට සිදුවිය හැකියි. සමීප අය සමඟ සුහදව කටයුතු කරන්න. මුදල් ගනුදෙනුවලදී සැලකිලිමත් වන්න.",
      fallbackColor: "සුදු",
      fallbackNumber: "02",
    },
    {
      code: "leo",
      symbol: "♌",
      nameSi: "සිංහ",
      nameEn: "Leo",
      fallbackPrediction: "නායකත්ව ගුණාංග විදහා දැක්වීමට අවස්ථාව සැලසේ. ආත්ම විශ්වාසයෙන් වැඩකටයුතු කරන්න. අන්‍යන්ගේ අදහස්වලටද ගරු කරන්න.",
      fallbackColor: "රන්වන් කහ",
      fallbackNumber: "01",
    },
    {
      code: "virgo",
      symbol: "♍",
      nameSi: "කන්‍යා",
      nameEn: "Virgo",
      fallbackPrediction: "සැලසුම් සහගතව කටයුතු කිරීමෙන් බලාපොරොත්තු ඉටු වේ. විස්තරාත්මක කාර්යයන් සාර්ථකව නිම කළ හැක. අධික විවේචනයෙන් වළකින්න.",
      fallbackColor: "කොළ",
      fallbackNumber: "05",
    },
    {
      code: "libra",
      symbol: "♎",
      nameSi: "තුලා",
      nameEn: "Libra",
      fallbackPrediction: "හවුල් ව්‍යාපාර සහ සබඳතා වඩාත් ශක්තිමත් වේ. සාමකාමී පරිසරයක සිත සැහැල්ලුවෙන් තබාගන්න. මූල්‍ය තීරණ සමබරව ගන්න.",
      fallbackColor: "ලා නිල්",
      fallbackNumber: "06",
    },
    {
      code: "scorpio",
      symbol: "♏",
      nameSi: "වෘශ්චික",
      nameEn: "Scorpio",
      fallbackPrediction: "සැඟවුණු හැකියාවන් ඉස්මතු වන දිනයකි. නොසැලෙන අධිෂ්ඨානයෙන් බාධක ජයගත හැක. ඉක්මන් කෝපය පාලනය කරගන්න.",
      fallbackColor: "තද රතු",
      fallbackNumber: "09",
    },
    {
      code: "sagittarius",
      symbol: "♐",
      nameSi: "ධනු",
      nameEn: "Sagittarius",
      fallbackPrediction: "නව ඉගෙනුම් හා ගමන් බිමන්වලට සුබයි. දූරදර්ශී අදහස් තුළින් සාර්ථකත්වය අත්වේ. අධික වියදම් සීමා කරන්න.",
      fallbackColor: "කහ",
      fallbackNumber: "03",
    },
    {
      code: "capricorn",
      symbol: "♑",
      nameSi: "මකර",
      nameEn: "Capricorn",
      fallbackPrediction: "වෘත්තීය ඉලක්ක සපුරාගැනීමට කැපවීම ප්‍රයෝජනවත් වේ. ඉවසීමෙන් කටයුතු කරන්න. වැඩිහිටියන්ගේ අවවාද පිළිපදින්න.",
      fallbackColor: "තද නිල්",
      fallbackNumber: "08",
    },
    {
      code: "aquarius",
      symbol: "♒",
      nameSi: "කුම්භ",
      nameEn: "Aquarius",
      fallbackPrediction: "නව අදහස් හා නවෝත්පාදන තුළින් සමාජයේ ප්‍රසාදය ලැබේ. මිතුරු ඇසුරින් උපකාර හිමිවේ. අනවශ්‍ය කරදරවලට මැදි නොවන්න.",
      fallbackColor: "අළු හෝ නිල්",
      fallbackNumber: "08",
    },
    {
      code: "pisces",
      symbol: "♓",
      nameSi: "මීන",
      nameEn: "Pisces",
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
    const nameEn = (p?.nameEn as string) || def.nameEn;

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

    lines.push(`${symbol} ${nameSi} ලග්නය (${nameEn})`);
    lines.push(prediction);
    lines.push(`සුබ වර්ණය: ${luckyColor}`);
    lines.push(`ජය අංකය: ${luckyNumber}`);
    lines.push("");
  }

  lines.push("🔮 අද දවසේ ඔබේ ලග්නය ගැන තවත් විස්තර දැනගන්න!");
  lines.push(
    "ඔබේ ලග්නයට අදාළ සම්පූර්ණ දෛනික පලාපල, පංචාංග තොරතුරු සහ පසුගිය හෝ ඉදිරි දිනවල ජ්යෝතිෂ අනාවැකි දැනගැනීමට Astro Tharaka වෙබ් අඩවියට පිවිසෙන්න."
  );
  lines.push("🌐 https://astrotharaka.com/daily-horoscope");
  lines.push("ඔබේ ලග්නය තෝරා “පලාපල බලන්න” යන්න මත Click කරන්න.");
  lines.push("ඔබේ කේන්දරය නොමිලේ බලාගන්න!");
  lines.push("ඔබේ උපන් දිනය, වේලාව සහ ස්ථානය අනුව කේන්දරය සහ ග්රහ පිහිටීම් ගැන දැනගන්න.");
  lines.push("🌐 https://astrotharaka.com");
  lines.push("ඔබේ ලග්නය මොකක්ද?");
  lines.push("අද දවසේ පලාපල ඔබේ ජීවිතයට ගැළපෙනවාද?");
  lines.push("Comment කරන්න. ඔබේ හිතවතුන්ටත් දැනගැනීමට මෙම Post එක Share කරන්න.");
  lines.push(currentTheme.wish);
  lines.push("🌙 Astro Tharaka – තරු අතරින් ජීවිතය කියවමු!");
  lines.push(
    "#AstroTharaka #AstrologyLK #DailyHoroscope #LagnaPalapala #SinhalaAstrology #ජ්යෝතිෂය #ලග්නපලාපල #දෛනිකලග්නපලාපල #කේන්දරය #SriLanka"
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

      const slstDayOfWeek = slstTime.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const bannerInfo = getBannerBuffer(slstDayOfWeek);
      const bannerFileName =
        bannerInfo?.fileName ||
        DAY_BANNER_NAMES[slstDayOfWeek] ||
        "daily-horoscope-banner.jpg";
      const publicBannerUrl = `${process.env.WEB_APP_URL || "https://astrotharaka.com"}/brand/banners/${bannerFileName}`;

      console.log(`[AstroTharaka Cron] Using daily banner for day ${slstDayOfWeek}: ${bannerFileName}`);

      const postWithPhoto = async (endpoint: string): Promise<Response> => {
        if (bannerInfo?.buffer) {
          const formData = new FormData();
          formData.append("caption", caption);
          formData.append("access_token", pageToken);
          const blob = new Blob([new Uint8Array(bannerInfo.buffer)], { type: "image/jpeg" });
          formData.append("source", blob, bannerInfo.fileName);
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
