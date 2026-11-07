import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hadithDir = path.join(__dirname, '..', 'public', 'hadith');
const mapPath = path.join(__dirname, 'narrator-arabic-map.json');

const rawMap = fs.readFileSync(mapPath, 'utf8');
const narratorMap = JSON.parse(rawMap);

function normalizeEnglishNarrator(value) {
  if (!value) return '';

  return value
    .toLowerCase()
    .replace(/\u0660|\u0661|\u0662|\u0663|\u0664|\u0665|\u0666|\u0667|\u0668|\u0669/g, '')
    .replace(/[`’‘]/g, ' ')
    .replace(/['’‘]/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^narrated\s+/, '')
    .replace(/^narrates\s+/, '')
.replace(/^hudhaifa that he saw a person bowing and prostrating imperfectly when he finished his salat hudhaifa told him that he had not offered salat the subnarrator added i think that hudhaifa also said\s+/, '')
    .replace(/^and narrated\s+/, '')
    .replace(/^after performing the ablution\s+/, '')
    .replace(/^the same narrator\s+/, '')
    .replace(/\bthe same narrator\b/g, '')
    .replace(/\bthe sub narrator\b/g, '')
    .replace(/\burwa said\b/g, '')
    .replace(/\bit has been narrated\b/g, '')
    .trim();
}

function extractHadiths(data) {
  if (Array.isArray(data)) return data;

  if (data && Array.isArray(data.hadiths)) return data.hadiths;

  if (data && Array.isArray(data.data)) return data.data;

  if (data && Array.isArray(data.results)) return data.results;

  return [];
}

function getEnglishNarrator(item) {
  if (!item) return '';

  if (item.english && item.english.narrator) {
    return item.english.narrator;
  }

  return item.narrator || item.narratorEnglish || item.narrator_en || '';
}

function getHadithId(item) {
  return item.id || item.number || item.hadithNumber || '';
}

const files = fs.readdirSync(hadithDir).filter(file => file.endsWith('.json'));

let totalHadiths = 0;
let totalUpdated = 0;
let totalUnmatched = 0;
const unmatchedSamples = [];

for (const file of files) {
  if (file !== 'bukhari.json') continue;

  const filePath = path.join(hadithDir, file);

  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`تعذر قراءة الملف: ${filePath}`);
    continue;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    console.error(`تعذر تحليل JSON في الملف: ${file}`);
    continue;
  }

  const hadiths = extractHadiths(data);

  if (!hadiths.length) continue;

  let updated = 0;
  let unmatched = 0;

  for (const item of hadiths) {
    const englishNarrator = getEnglishNarrator(item);

    if (!englishNarrator) {
      item.arabicNarrator = '';
      continue;
    }

    const normalized = normalizeEnglishNarrator(englishNarrator);
    const arabicNarrator = narratorMap[normalized];

    if (arabicNarrator) {
      item.arabicNarrator = arabicNarrator;
      updated++;
    } else {
      item.arabicNarrator = englishNarrator;
      unmatched++;

      if (unmatchedSamples.length < 30) {
        unmatchedSamples.push({
          file,
          hadith: getHadithId(item),
          original: englishNarrator,
          normalized
        });
      }
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

  totalHadiths += hadiths.length;
  totalUpdated += updated;
  totalUnmatched += unmatched;

  console.log(`تم فحص ${hadiths.length} حديثاً في ${file}`);
  console.log(`تمت إضافة الاسم العربي إلى ${updated} حديثاً`);
  console.log(`عدد الرواة غير المطابقين في ${file}: ${unmatched}`);
}

console.log('\nالإجمالي:');
console.log(`تم فحص ${totalHadiths} حديثاً`);
console.log(`تمت إضافة الاسم العربي إلى ${totalUpdated} حديثاً`);
console.log(`عدد الرواة غير المطابقين حتى الآن: ${totalUnmatched}`);

if (unmatchedSamples.length) {
  console.log('\nأمثلة من الرواة غير المطابقين:');

  for (const sample of unmatchedSamples) {
    console.log(`- ${sample.file} | حديث ${sample.hadith} | ${sample.original} | بعد التنظيف: ${sample.normalized}`);
  }
}