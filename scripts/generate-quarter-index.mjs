import fs from 'node:fs'
import path from 'node:path'

const versesFile = 'public/mushaf-qcf4/verses.json'
const outputFile = 'public/mushaf/quarter-index.json'

const API_BASE =
  'https://api.quran.com/api/v4/verses/by_rub_el_hizb'

async function main() {
  const verses = JSON.parse(
    fs.readFileSync(versesFile, 'utf8'),
  )

  const quarters = []

  for (let quarter = 1; quarter <= 240; quarter++) {
    const url = `${API_BASE}/${quarter}?per_page=1`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(
        `فشل تحميل الربع ${quarter}: ${response.status}`,
      )
    }

    const data = await response.json()

    const firstVerse =
      data?.verses?.[0] ||
      data?.data?.verses?.[0]

    if (!firstVerse) {
      throw new Error(
        `لم يتم العثور على آية في الربع ${quarter}`,
      )
    }

    const verseKey =
      firstVerse.verse_key ||
      firstVerse.verseKey

    if (!verseKey) {
      throw new Error(
        `لم يتم العثور على verse_key في الربع ${quarter}`,
      )
    }

    const ayah = verses[verseKey]

    if (!ayah) {
      throw new Error(
        `لم يتم العثور على الآية ${verseKey} في verses.json`,
      )
    }

    quarters.push({
      quarter,
      page: ayah.page,
      verseKey,
    })

    // تأخير بسيط لتجنب الضغط على الـAPI
    await new Promise((resolve) =>
      setTimeout(resolve, 50),
    )
  }

  if (quarters.length !== 240) {
    throw new Error(
      `عدد الأرباع يجب أن يكون 240، لكنه ${quarters.length}`,
    )
  }

  fs.mkdirSync(path.dirname(outputFile), { recursive: true })

  fs.writeFileSync(
    outputFile,
    JSON.stringify(quarters, null, 2),
    'utf8',
  )

  console.log(
    `تم إنشاء ${quarters.length} ربع حزب في: ${outputFile}`,
  )
}

main()