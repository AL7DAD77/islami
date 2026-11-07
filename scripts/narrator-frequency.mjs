import fs from 'node:fs'
import path from 'node:path'

const inputCsv = 'narrators-review.csv'
const outputCsv = 'narrator-frequency.csv'

function parseCsvLine(line) {
  const values = []
  let currentValue = ''
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const character = line[i]

    if (character === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        currentValue += '"'
        i++
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (character === ',' && !insideQuotes) {
      values.push(currentValue)
      currentValue = ''
    } else {
      currentValue += character
    }
  }

  values.push(currentValue)
  return values
}

function cleanEnglishNarrator(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/^Narrated\s+/i, '')
    .replace(/:$/, '')
    .trim()
}

const rawData = fs.readFileSync(inputCsv, 'utf8')
const lines = rawData.split(/\r?\n/).filter(Boolean)

if (lines.length === 0) {
  console.error('ملف narrators-review.csv فارغ أو غير موجود')
  process.exit(1)
}

const header = parseCsvLine(lines[0])
const englishNarratorIndex = header.indexOf('englishNarrator')

if (englishNarratorIndex === -1) {
  console.error('لم يتم العثور على عمود englishNarrator')
  process.exit(1)
}

const counts = new Map()

for (let i = 1; i < lines.length; i++) {
  const values = parseCsvLine(lines[i])
  const rawNarrator = values[englishNarratorIndex]
  const narrator = cleanEnglishNarrator(rawNarrator)

  if (!narrator) continue

  counts.set(narrator, (counts.get(narrator) || 0) + 1)
}

const sortedNarrators = [...counts.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 300)

const csvHeader = 'englishNarrator,count'
const csvRows = sortedNarrators.map(([narrator, count]) => {
  return `${narrator},${count}`
})

fs.writeFileSync(
  outputCsv,
  `${csvHeader}\n${csvRows.join('\n')}\n`,
  'utf8'
)

console.log(`تم تحليل ${lines.length - 1} حديثاً`)
console.log(`عدد أسماء الرواة الفريدة: ${counts.size}`)
console.log(`تم إنشاء أهم 300 اسم في: ${outputCsv}`)