/** Age-bracket salutations for full horoscope intros (EN / SI / TA). */

export type SalutationGender = 'male' | 'female' | 'other';

export type SalutationResult = {
  ageYears: number | null;
  bracket: 'child' | 'youth' | 'adult' | 'elder';
  /** Short form used in running text, e.g. "Mr. Niroshan" / "පින්වත් මහතා" */
  shortForm: string;
  /** Full opening line for the introduction */
  openingLine: string;
  /** Guidance string for the AI */
  promptHint: string;
};

function normalizeGender(raw?: string | null): SalutationGender {
  const g = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (['m', 'male', 'man', 'boy', 'පුරුෂ', 'පුරුෂයා', 'ஆண்'].includes(g)) return 'male';
  if (['f', 'female', 'woman', 'girl', 'ස්ත්‍රී', 'ගැහැණු', 'பெண்'].includes(g)) return 'female';
  return 'other';
}

export function ageYearsFromBirthDate(birthDate: string, asOf = new Date()): number | null {
  const m = String(birthDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || !mo || !d) return null;
  let age = asOf.getFullYear() - y;
  const monthDiff = asOf.getMonth() + 1 - mo;
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < d)) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

function bracketForAge(age: number | null): SalutationResult['bracket'] {
  if (age == null) return 'adult';
  if (age <= 5) return 'child';
  if (age <= 17) return 'youth';
  if (age >= 60) return 'elder';
  return 'adult';
}

/**
 * Build respectful opening address by age + gender (matches Taraka full-report style guide).
 */
export function buildSalutation(input: {
  fullName: string;
  gender?: string | null;
  birthDate: string;
  language: string;
}): SalutationResult {
  const name = input.fullName.trim() || 'Friend';
  const gender = normalizeGender(input.gender);
  const ageYears = ageYearsFromBirthDate(input.birthDate);
  const bracket = bracketForAge(ageYears);
  const lang = input.language === 'si' || input.language === 'ta' ? input.language : 'en';

  if (lang === 'si') {
    return sinhalaSalutation(name, gender, bracket, ageYears);
  }
  if (lang === 'ta') {
    return tamilSalutation(name, gender, bracket, ageYears);
  }
  return englishSalutation(name, gender, bracket, ageYears);
}

function englishSalutation(
  name: string,
  gender: SalutationGender,
  bracket: SalutationResult['bracket'],
  ageYears: number | null,
): SalutationResult {
  let shortForm = name;
  let openingLine = `Dear ${name},`;

  switch (bracket) {
    case 'child':
      shortForm =
        gender === 'female' ? `Blessed Princess ${name}` : `Blessed Prince ${name}`;
      if (gender === 'other') shortForm = `Blessed Child ${name}`;
      openingLine = `To the ${shortForm},`;
      break;
    case 'youth':
      shortForm = gender === 'female' ? `Dear Miss ${name}` : `Dear Master ${name}`;
      if (gender === 'other') shortForm = `Dear ${name}`;
      openingLine = `${shortForm},`;
      break;
    case 'elder':
      shortForm =
        gender === 'female'
          ? `Respected Elder Mrs. ${name}`
          : `Respected Elder Mr. ${name}`;
      if (gender === 'other') shortForm = `Respected Elder ${name}`;
      openingLine = `To the ${shortForm},`;
      break;
    default:
      if (gender === 'female') {
        shortForm = `Ms. ${name}`;
        openingLine = `With Blessings, Ms. ${name},`;
      } else if (gender === 'male') {
        shortForm = `Mr. ${name}`;
        openingLine = `With Best Wishes, Mr. ${name},`;
      } else {
        shortForm = name;
        openingLine = `With Best Wishes, ${name},`;
      }
  }

  return {
    ageYears,
    bracket,
    shortForm,
    openingLine,
    promptHint: `Open the introduction EXACTLY with: "${openingLine}" then continue with formal Vedic welcome. Age bracket=${bracket}, ageYears=${ageYears ?? 'unknown'}. Use "${shortForm}" when addressing the native in later paragraphs.`,
  };
}

function sinhalaSalutation(
  name: string,
  gender: SalutationGender,
  bracket: SalutationResult['bracket'],
  ageYears: number | null,
): SalutationResult {
  let shortForm = name;
  let openingLine = `${name} ඔබට,`;

  switch (bracket) {
    case 'child':
      shortForm =
        gender === 'female' ? `පින්වත් කුමාරිය ${name}` : `පින්වත් කුමාර ${name}`;
      if (gender === 'other') shortForm = `පින්වත් දරුවා ${name}`;
      openingLine = `${shortForm} වෙත,`;
      break;
    case 'youth':
      shortForm = gender === 'female' ? `ප්‍රිය මිස් ${name}` : `ප්‍රිය මාස්ටර් ${name}`;
      if (gender === 'other') shortForm = `ප්‍රිය ${name}`;
      openingLine = `${shortForm},`;
      break;
    case 'elder':
      shortForm =
        gender === 'female' ? `ගෞරවනීය මහත්මිය ${name}` : `ගෞරවනීය මහතා ${name}`;
      if (gender === 'other') shortForm = `ගෞරවනීය ${name}`;
      openingLine = `${shortForm} වෙත,`;
      break;
    default:
      if (gender === 'female') {
        shortForm = `${name} මහත්මිය`;
        openingLine = `ආශිර්වාද සහිතව, ${name} මහත්මිය,`;
      } else if (gender === 'male') {
        shortForm = `${name} මහතා`;
        openingLine = `සුභාශිංසා සහිතව, ${name} මහතා,`;
      } else {
        shortForm = name;
        openingLine = `සුභාශිංසා සහිතව, ${name},`;
      }
  }

  return {
    ageYears,
    bracket,
    shortForm,
    openingLine,
    promptHint: `හැඳින්වීම ආරම්භ කළ යුත්තේ මෙම පේළියෙන්ම: "${openingLine}" ඉන්පසු තාරකා සේවාවේ නිල පිළිගැනීම. වයස් කාණ්ඩය=${bracket}, වයස=${ageYears ?? 'නොදනී'}. පසු ඡේදවල "${shortForm}" ලෙස ආමන්ත්‍රණය කරන්න.`,
  };
}

function tamilSalutation(
  name: string,
  gender: SalutationGender,
  bracket: SalutationResult['bracket'],
  ageYears: number | null,
): SalutationResult {
  let shortForm = name;
  let openingLine = `அன்புள்ள ${name},`;

  switch (bracket) {
    case 'child':
      shortForm = gender === 'female' ? `பாக்கியம் பெற்ற இளவரசி ${name}` : `பாக்கியம் பெற்ற இளவரசன் ${name}`;
      if (gender === 'other') shortForm = `பாக்கியம் பெற்ற குழந்தை ${name}`;
      openingLine = `${shortForm} அவர்களுக்கு,`;
      break;
    case 'youth':
      shortForm = gender === 'female' ? `அன்புள்ள செல்வி ${name}` : `அன்புள்ள மாஸ்டர் ${name}`;
      if (gender === 'other') shortForm = `அன்புள்ள ${name}`;
      openingLine = `${shortForm},`;
      break;
    case 'elder':
      shortForm =
        gender === 'female' ? `மதிப்பிற்குரிய திருமதி ${name}` : `மதிப்பிற்குரிய திரு ${name}`;
      if (gender === 'other') shortForm = `மதிப்பிற்குரிய ${name}`;
      openingLine = `${shortForm} அவர்களுக்கு,`;
      break;
    default:
      if (gender === 'female') {
        shortForm = `திருமதி / செல்வி ${name}`;
        openingLine = `ஆசியுடன், செல்வி ${name},`;
      } else if (gender === 'male') {
        shortForm = `திரு ${name}`;
        openingLine = `நல்வாழ்த்துகளுடன், திரு ${name},`;
      } else {
        shortForm = name;
        openingLine = `நல்வாழ்த்துகளுடன், ${name},`;
      }
  }

  return {
    ageYears,
    bracket,
    shortForm,
    openingLine,
    promptHint: `Open introduction with: "${openingLine}". Age bracket=${bracket}, age=${ageYears ?? 'unknown'}. Address as "${shortForm}" later.`,
  };
}
