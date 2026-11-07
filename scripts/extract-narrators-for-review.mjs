import fs from 'node:fs'
import path from 'node:path'

const files = [
  {
    input: 'public/hadith/bukhari.json',
    book: 'bukhari'
  },
  {
    input: 'public/hadith/muslim.json',
    book: 'muslim'
  }
]

const outputCsv = 'narrators-review.csv'

function cleanArabicText(text) {
  return String(text ?? '')
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanNarratorCandidate(candidate) {
  return String(candidate ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\s*ـ\s*/g, ' ـ ')
    .replace(/\s*،\s*$/g, '')
    .replace(/\s*\.\s*$/g, '')
    .replace(/\s+على\s+المنبر\s*$/g, '')
    .replace(/\s+في\s+حديثه\s+هذا\s*$/g, '')
    .trim()
}

function isValidNarratorCandidate(candidate) {
  if (!candidate) return false

  const invalidExactNames = [
    'النبي',
    'النبي صلى الله عليه وسلم',
    'رسول الله',
    'رسول الله صلى الله عليه وسلم',
    'أبيه',
    'أبيها',
    'أبيهما',
    'ذلك',
    'من ابن أخيك',
    'الزهري',
    'الأعمش',
    'أبو إدريس'
  ]

  return !invalidExactNames.includes(candidate)
}

function extractNarratorCandidate(arabicText) {
  const text = cleanArabicText(arabicText)

  const directNarratorPatterns = [
    /عن\s+([^،\.]+?)\s*(?:رضي الله عنه|رضى الله عنه)?\s*،\s*عن\s+النبي/g,
    /عن\s+([^،\.]+?)\s*(?:رضي الله عنه|رضى الله عنه)?\s*،\s*عن\s+رسول الله/g,
    /سمعت\s+([^،\.]+?)\s*(?:رضي الله عنه|رضى الله عنه)?\s*،\s*عن\s+النبي/g,
    /سمعت\s+([^،\.]+?)\s*(?:رضي الله عنه|رضى الله عنه)?\s*،\s*عن\s+رسول الله/g,
    /سمع\s+([^،\.]+?)\s*(?:رضي الله عنه|رضى الله عنه)?\s*،\s*عن\s+النبي/g,
    /سمع\s+([^،\.]+?)\s*(?:رضي الله عنه|رضى الله عنه)?\s*،\s*عن\s+رسول الله/g
  ]

  for (const pattern of directNarratorPatterns) {
    const matches = [...text.matchAll(pattern)]

    if (matches.length > 0) {
      const candidate = cleanNarratorCandidate(
        matches[matches.length - 1][1]
      )

      if (isValidNarratorCandidate(candidate)) {
        return candidate
      }
    }
  }

  const prophetMarkers = [
    'عن النبي',
    'عن رسول الله',
    'سمعت النبي',
    'سمعت رسول الله',
    'سمع النبي',
    'سمع رسول الله'
  ]

  let isnadEndIndex = text.length

  for (const marker of prophetMarkers) {
    const index = text.indexOf(marker)

    if (index > -1 && index < isnadEndIndex) {
      isnadEndIndex = index
    }
  }

  const isnadPart = text.slice(0, isnadEndIndex)

  const matches = [
    ...isnadPart.matchAll(
      /(?:عن|سمعت|سمع|أخبرني|أخبرنا)\s+([^،\.]+?)(?=\s*(?:،|\.|ـ|أن|أنّ|$))/gu
    )
  ]

  const candidates = matches
    .map((match) => cleanNarratorCandidate(match[1]))
    .filter(isValidNarratorCandidate)

  if (candidates.length === 0) {
    return ''
  }

  return candidates[candidates.length - 1]
}

function escapeCsv(value) {
  const safeValue = String(value ?? '')

  if (
    safeValue.includes(',') ||
    safeValue.includes('"') ||
    safeValue.includes('\n') ||
    safeValue.includes('\r')
  ) {
    return `"${safeValue.replace(/"/g, '""')}"`
  }

  return safeValue
}

const rows = []
let totalHadiths = 0
let extractedCount = 0

for (const file of files) {
  const filePath = path.resolve(file.input)

  if (!fs.existsSync(filePath)) {
    console.error(`الملف غير موجود: ${filePath}`)
    continue
  }

  const rawData = fs.readFileSync(filePath, 'utf8')
  const data = JSON.parse(rawData)

  for (const hadith of data.hadiths) {
    totalHadiths++

    const candidate = extractNarratorCandidate(hadith.arabic)

    if (candidate) {
      extractedCount++
    }

    rows.push({
      book: file.book,
      hadithId: hadith.id,
      chapterId: hadith.chapterId,
      englishNarrator: hadith.english?.narrator || '',
      arabicNarratorCandidate: candidate,
      arabicTextStart: cleanArabicText(hadith.arabic).slice(0, 180)
    })
  }
}

const csvHeader = [
  'book',
  'hadithId',
  'chapterId',
  'englishNarrator',
  'arabicNarratorCandidate',
  'arabicTextStart'
].join(',')

const csvRows = rows.map((row) => {
  return [
    escapeCsv(row.book),
    escapeCsv(row.hadithId),
    escapeCsv(row.chapterId),
    escapeCsv(row.englishNarrator),
    escapeCsv(row.arabicNarratorCandidate),
    escapeCsv(row.arabicTextStart)
  ].join(',')
})

fs.writeFileSync(outputCsv, `${csvHeader}\n${csvRows.join('\n')}\n`, 'utf8')

console.log(`تم فحص ${totalHadiths} حديثاً`)
console.log(`تم استخراج مرشح لاسم الراوي في ${extractedCount} حديثاً`)
console.log(`تم إنشاء ملف المراجعة: ${outputCsv}`)