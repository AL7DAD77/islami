import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hadithDir = path.join(__dirname, '..', 'public', 'hadith');
const filePath = path.join(hadithDir, 'muslim.json');

const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

console.log('نوع البيانات الرئيسية:', Array.isArray(data) ? 'Array' : typeof data);

if (!Array.isArray(data)) {
  console.log('المفاتيح الرئيسية:', Object.keys(data));
}

const hadiths = Array.isArray(data)
  ? data
  : data.hadiths || data.data || data.results || [];

console.log('عدد الأحاديث:', hadiths.length);

const first = hadiths[0];

if (first) {
  console.log('\nمفاتيح أول حديث:');
  console.log(Object.keys(first));

  console.log('\nأول حديث:');
  console.log(JSON.stringify(first, null, 2));
}