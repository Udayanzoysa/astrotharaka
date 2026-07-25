import type { ChartResult } from '../chart/types';
import type { NarrativeSection } from '../ai/types';
import { renderKundaliSvg } from '../kundali/kundali-svg';
import { formatSectionBodyHtml } from './format-narrative';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function isIntroHeading(heading: string): boolean {
  const h = heading.trim().toLowerCase();
  return (
    h.includes('හැඳින්වීම') ||
    h.includes('introduction') ||
    h.includes('அறிமுகம்') ||
    h.includes('සමස්ත විමසුම')
  );
}

function pdfChrome(lang: string) {
  if (lang === 'si') {
    return {
      companyEn: 'Taraka Astrology Services',
      companySi: 'තාරකා ජ්‍යෝතිෂ්‍ය සේවය',
      reportTitle: 'මූලික උපන් සිතියම් වාර්තාව',
      reportTitleEn: 'Basic Birth Chart Report',
      tagline: 'තාරකා විශ්වය හරහා ඔබගේ අනාගතය කරා මග පෙන්වීම.',
      order: 'ඇණවුම',
      name: 'නම',
      birth: 'උපත',
      place: 'උපන් ස්ථානය',
      language: 'භාෂාව',
      accuracy:
        'නිරවද්‍යතා සටහන: උපන් වේලාව ආසන්න හෝ නොදන්නා බැවින් භාව සහ කාල විස්තර අඩු විය හැක.',
      kundali: 'රාශි කුණ්ඩලී (Rasi Kundali)',
      chartSummary: 'සිතියම් සාරාංශය',
      lagna: 'ලග්නය',
      planet: 'ග්‍රහයා',
      sign: 'රාශිය',
      house: 'භාවය',
      degree: 'අංශක',
      engine: 'Swiss Ephemeris (Lahiri sidereal)',
      disclaimer:
        'වියාචනය: ජ්‍යෝතිෂ මගපෙන්වීම සංස්කෘතික, අධ්‍යාත්මික සහ විනෝදාත්මක අරමුණු සඳහා පමණි. කර්මය, නිදහස් කැමැත්ත සහ පුද්ගලික උත්සාහය අනාගතයට බලපායි. මෙම වාර්තාව ප්‍රතිඵල සහතික නොකරයි; වෛද්‍ය, නීතිමය හෝ මූල්‍ය උපදෙස් නොවේ.',
      closing:
        'තාරකා ජ්‍යෝතිෂ්‍ය සේවය වෙනුවෙන් ඔබට දීර්ඝායුෂ, නිරෝගී සුවය සහ සියලු යහපත් ප්‍රාර්ථනා සාර්ථක වේවා!',
    };
  }
  if (lang === 'ta') {
    return {
      companyEn: 'Taraka Astrology Services',
      companySi: 'தாரகா ஜோதிட சேவை',
      reportTitle: 'அடிப்படை பிறப்பு வரைபட அறிக்கை',
      reportTitleEn: 'Basic Birth Chart Report',
      tagline: 'விண்வெளி வழியாக உங்கள் எதிர்காலத்தை வழிநடத்துதல்.',
      order: 'ஆர்டர்',
      name: 'பெயர்',
      birth: 'பிறப்பு',
      place: 'பிறந்த இடம்',
      language: 'மொழி',
      accuracy:
        'துல்லியக் குறிப்பு: பிறந்த நேரம் தோராயமானது அல்லது தெரியாதது; பாவம் மற்றும் நேர விவரங்கள் குறையலாம்.',
      kundali: 'ராசி குண்டலி',
      chartSummary: 'வரைபட சுருக்கம்',
      lagna: 'லக்னம்',
      planet: 'கிரகம்',
      sign: 'ராசி',
      house: 'பாவம்',
      degree: 'டிகிரி',
      engine: 'Swiss Ephemeris (Lahiri sidereal)',
      disclaimer:
        'பொறுப்புத்துறப்பு: ஜோதிட வழிகாட்டல் கலாச்சார, ஆன்மீக நோக்கங்களுக்கானது. கர்மம் மற்றும் தனிப்பட்ட முயற்சி முக்கியம். முடிவுகளை உத்தரவாதம் செய்யாது.',
      closing: 'தாரகா ஜோதிட சேவை சார்பாக நீண்ட ஆயுள், நல்வாழ்வு வாழ்த்துகிறோம்!',
    };
  }
  return {
    companyEn: 'Taraka Astrology Services',
    companySi: 'තාරකා ජ්‍යෝතිෂ්‍ය සේවය',
    reportTitle: 'Basic Birth Chart Report',
    reportTitleEn: 'මූලික උපන් සිතියම් වාර්තාව',
    tagline: 'Navigating a destiny through the air mass.',
    order: 'Order',
    name: 'Name',
    birth: 'Birth',
    place: 'Birth place',
    language: 'Language',
    accuracy:
      'Accuracy notice: birth time is approximate or unknown; house and timing details may be reduced.',
    kundali: 'Rasi Kundali',
    chartSummary: 'Chart summary',
    lagna: 'Lagna',
    planet: 'Planet',
    sign: 'Sign',
    house: 'House',
    degree: 'Degree',
    engine: 'Swiss Ephemeris (Lahiri sidereal)',
    disclaimer:
      'Disclaimer: Astrology guidance for cultural, spiritual, and entertainment purposes. Karma, free will, and personal effort shape outcomes. Reports do not guarantee results and are not medical, legal, or financial advice.',
    closing:
      'With blessings from Taraka Astrology Services — may you enjoy long life, good health, and fulfilment of wholesome aspirations.',
  };
}

function buildCoverGreeting(input: {
  language: string;
  fullName: string;
  birthPlace: string;
  gender?: string | null;
}): string {
  const name = input.fullName.trim() || 'Client';
  const place = input.birthPlace.trim() || '—';
  const g = String(input.gender ?? '')
    .trim()
    .toLowerCase();
  const female = ['f', 'female', 'woman', 'girl', 'ස්ත්‍රී', 'பெண்'].includes(g);
  const male = ['m', 'male', 'man', 'boy', 'පුරුෂ', 'ஆண்'].includes(g);

  if (input.language === 'si') {
    const honor = female ? 'මහත්මිය' : male ? 'මහතා' : 'ඔබ';
    return `ආයුබෝවන් ${escapeHtml(name)} ${honor}. ${escapeHtml(
      place,
    )} හි උපත ලැබූ ඔබ වෙනුවෙන්, තාරකා ජ්‍යෝතිෂ්‍ය සේවය (Taraka Astrology Services) ඔබගේ සම්පූර්ණ උපන් සිතියම් වාර්තාව ගෞරවයෙන් හා සාදරයෙන් ඉදිරිපත් කරයි.`;
  }
  if (input.language === 'ta') {
    const honor = female ? 'திருமதி' : male ? 'திரு' : '';
    return `வணக்கம் ${honor ? `${honor} ` : ''}${escapeHtml(name)}. ${escapeHtml(
      place,
    )} இல் பிறந்த உங்களுக்காக, தாரகா ஜோதிட சேவை உங்கள் முழு பிறப்பு வரைபட அறிக்கையை மரியாதையுடன் வழங்குகிறது.`;
  }
  const honor = female ? 'Mrs.' : male ? 'Mr.' : '';
  return `Hello ${honor ? `${honor} ` : ''}${escapeHtml(name)}. Born in ${escapeHtml(
    place,
  )}, Taraka Astrology Services warmly and respectfully presents your complete birth chart report.`;
}

export type HtmlReportInput = {
  title: string;
  orderNumber: string;
  fullName: string;
  birthPlace: string;
  birthDate: string;
  language: string;
  unknownBirthTime: boolean;
  gender?: string | null;
  chart: ChartResult;
  sections: NarrativeSection[];
};

export function buildReportHtml(input: HtmlReportInput): string {
  const chrome = pdfChrome(input.language);
  const kundali = renderKundaliSvg(input.chart, `Kundali — ${input.fullName}`).replace(
    /^<\?xml[^>]*>\s*/i,
    '',
  );

  const planetRows = input.chart.planets
    .slice(0, 9)
    .map(
      (p) =>
        `<tr><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.sign)}</td><td>H${p.house}</td><td>${p.degree.toFixed(
          1,
        )}°${p.retrograde ? ' R' : ''}</td></tr>`,
    )
    .join('');

  const introSection = input.sections.find((s) => isIntroHeading(s.heading));
  const bodySections = input.sections.filter((s) => !isIntroHeading(s.heading));

  const coverGreeting = buildCoverGreeting({
    language: input.language,
    fullName: input.fullName,
    birthPlace: input.birthPlace,
    gender: input.gender,
  });

  const introHtml = introSection
    ? `<div class="greeting-expand">${formatSectionBodyHtml(introSection.body)}</div>`
    : '';

  const sectionsHtml = bodySections
    .map((s) => {
      const bodyHtml = formatSectionBodyHtml(s.body);
      return `<section class="block"><h2>${escapeHtml(s.heading)}</h2><hr class="section-rule"/><div class="section-body">${bodyHtml}</div></section>`;
    })
    .join('\n');

  const engineNote = input.chart.placeholder
    ? 'Chart engine: stub fallback'
    : chrome.engine;

  return `<!DOCTYPE html>
<html lang="${escapeHtml(input.language)}">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(chrome.reportTitle)} — ${escapeHtml(input.fullName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Abhaya+Libre:wght@400;600;700&family=Noto+Serif+Sinhala:wght@400;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap" rel="stylesheet"/>
  <style>
    @page {
      size: A4;
      margin: 16mm 14mm 18mm 14mm;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #2c2c2c;
      background: #fbf7ef;
      font-family: "Noto Serif Sinhala", "Abhaya Libre", "Nirmala UI", "Source Serif 4", Georgia, serif;
      font-size: 12.5px;
      line-height: 1.75;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cover {
      border: 1.5px solid #1a365d;
      border-radius: 6px;
      padding: 18px 20px 16px;
      margin-bottom: 18px;
      background: linear-gradient(180deg, #fffdf8 0%, #f7f0e4 100%);
      page-break-inside: avoid;
    }
    .company-en {
      margin: 0;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #1a365d;
      font-weight: 700;
    }
    .company-si {
      margin: 4px 0 0;
      font-size: 20px;
      font-weight: 700;
      color: #7a1f2b;
    }
    .tagline {
      margin: 6px 0 14px;
      font-size: 11px;
      color: #5c6570;
      font-style: italic;
    }
    .report-title {
      margin: 0 0 4px;
      font-size: 18px;
      font-weight: 700;
      color: #1a365d;
      line-height: 1.35;
    }
    .report-title-en {
      margin: 0 0 14px;
      font-size: 12px;
      color: #7a1f2b;
      font-weight: 600;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 16px;
      margin: 0 0 14px;
      padding: 10px 12px;
      background: #fff;
      border: 1px solid #d9cfc0;
      border-radius: 4px;
      font-size: 12px;
    }
    .meta-grid .label { color: #5c6570; font-weight: 600; }
    .meta-grid .value { color: #1f2933; }
    .greeting {
      margin: 0;
      padding: 12px 14px;
      background: #fff;
      border-left: 4px solid #7a1f2b;
      color: #1f2933;
      font-size: 13px;
      line-height: 1.7;
    }
    .greeting-expand { margin-top: 10px; }
    .greeting-expand p { margin: 0 0 8px; font-size: 12.5px; }
    .note {
      margin: 8px 0 0;
      font-size: 10.5px;
      color: #8a6d3b;
    }
    .ok { color: #2f5d3a; }
    h2 {
      margin: 0 0 6px;
      color: #1a365d;
      font-size: 15px;
      font-weight: 700;
      line-height: 1.4;
      letter-spacing: 0.01em;
    }
    h3 {
      margin: 16px 0 8px;
      padding: 6px 0 4px 10px;
      border-left: 3px solid #7a1f2b;
      color: #7a1f2b;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.4;
      page-break-after: avoid;
      break-after: avoid;
    }
    h3:first-child { margin-top: 0; }
    h4 {
      margin: 12px 0 6px;
      color: #1a365d;
      font-size: 12.5px;
      font-weight: 700;
      page-break-after: avoid;
    }
    .section-rule {
      border: none;
      border-top: 1px solid #c4b39a;
      margin: 0 0 12px;
    }
    .block {
      margin: 0 0 18px;
      padding: 14px 16px 12px;
      background: #fffdf8;
      border: 1px solid #e2d6c4;
      border-radius: 4px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .block p {
      margin: 0 0 11px;
      font-size: 12.5px;
      color: #2c2c2c;
      line-height: 1.8;
      text-align: justify;
      hyphens: auto;
    }
    .block p:last-child,
    .block ul:last-child,
    .block ol:last-child { margin-bottom: 0; }
    .block strong { color: #1a365d; font-weight: 700; }
    .block ul, .block ol {
      margin: 4px 0 12px;
      padding-left: 1.4em;
      font-size: 12.5px;
      line-height: 1.75;
    }
    .block li {
      margin: 0 0 7px;
      padding-left: 2px;
    }
    .block li::marker { color: #7a1f2b; font-weight: 700; }
    .greeting-expand h3 {
      margin-top: 12px;
      font-size: 12.5px;
    }
    .greeting-expand p {
      margin: 0 0 10px;
      font-size: 12.5px;
      line-height: 1.8;
      text-align: justify;
    }
    .greeting-expand ul, .greeting-expand ol {
      margin: 4px 0 10px;
      padding-left: 1.35em;
    }
    .kundali-wrap, .chart-wrap {
      margin: 0 0 16px;
      padding: 12px 14px;
      background: #fffdf8;
      border: 1px solid #e2d6c4;
      border-radius: 4px;
      page-break-inside: avoid;
    }
    .kundali { text-align: center; margin-top: 8px; }
    .kundali svg { max-width: 360px; height: auto; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11.5px;
      margin: 8px 0 4px;
    }
    th, td {
      border-bottom: 1px solid #e6e0d4;
      text-align: left;
      padding: 7px 5px;
      color: #2c2c2c;
    }
    th {
      color: #1a365d;
      font-weight: 700;
      background: #f3ebe0;
    }
    .footer {
      margin-top: 22px;
      padding-top: 14px;
      border-top: 2px solid #1a365d;
      page-break-inside: avoid;
    }
    .closing {
      margin: 0 0 12px;
      font-size: 13px;
      color: #7a1f2b;
      font-weight: 600;
      line-height: 1.65;
    }
    .disclaimer {
      margin: 0;
      font-size: 10px;
      color: #5c6570;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <header class="cover">
    <p class="company-en">${escapeHtml(chrome.companyEn)}</p>
    <p class="company-si">${escapeHtml(chrome.companySi)}</p>
    <p class="tagline">${escapeHtml(chrome.tagline)}</p>

    <h1 class="report-title">${escapeHtml(chrome.reportTitle)}</h1>
    <p class="report-title-en">${escapeHtml(chrome.reportTitleEn)}</p>

    <div class="meta-grid">
      <div><span class="label">${escapeHtml(chrome.order)}:</span> <span class="value">${escapeHtml(input.orderNumber)}</span></div>
      <div><span class="label">${escapeHtml(chrome.language)}:</span> <span class="value">${escapeHtml(input.language)}</span></div>
      <div><span class="label">${escapeHtml(chrome.name)}:</span> <span class="value">${escapeHtml(input.fullName)}</span></div>
      <div><span class="label">${escapeHtml(chrome.birth)}:</span> <span class="value">${escapeHtml(input.birthDate)}</span></div>
      <div><span class="label">${escapeHtml(chrome.place)}:</span> <span class="value">${escapeHtml(input.birthPlace)}</span></div>
      <div><span class="label">Engine:</span> <span class="value">${escapeHtml(engineNote)}</span></div>
    </div>

    <div class="greeting">${coverGreeting}${introHtml}</div>
    ${input.unknownBirthTime ? `<p class="note">${escapeHtml(chrome.accuracy)}</p>` : ''}
  </header>

  <section class="kundali-wrap">
    <h2>${escapeHtml(chrome.kundali)}</h2>
    <hr class="section-rule"/>
    <div class="kundali">${kundali}</div>
  </section>

  <section class="chart-wrap">
    <h2>${escapeHtml(chrome.chartSummary)}</h2>
    <hr class="section-rule"/>
    <p><strong>${escapeHtml(chrome.lagna)}:</strong> ${escapeHtml(input.chart.lagna.sign)} · ${input.chart.lagna.degree.toFixed(1)}° (${escapeHtml(
      input.chart.lagna.houseSystem,
    )})</p>
    <table>
      <thead>
        <tr>
          <th>${escapeHtml(chrome.planet)}</th>
          <th>${escapeHtml(chrome.sign)}</th>
          <th>${escapeHtml(chrome.house)}</th>
          <th>${escapeHtml(chrome.degree)}</th>
        </tr>
      </thead>
      <tbody>${planetRows}</tbody>
    </table>
  </section>

  ${sectionsHtml}

  <footer class="footer">
    <p class="closing">${escapeHtml(chrome.closing)}</p>
    <p class="disclaimer">${escapeHtml(chrome.disclaimer)}</p>
  </footer>
</body>
</html>`;
}
