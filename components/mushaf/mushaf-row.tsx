import { cn } from '@/lib/utils'
import { isAyahMarker } from '@/lib/mushaf'
import type { MushafLine, MushafMeta } from '@/lib/mushaf'

export type AyahRef = { s: number; a: number }

/**
 * سطر واحد من صفحة المصحف: اسم سورة، أو بسملة، أو آيات (مضبوطة على العرض أو متوسَّطة).
 * التحديد والتظليل والعلامات اختيارية: بدونها يكون السطر للقراءة فقط (كما في الورد اليومي).
 */
export function MushafRow({
  line,
  meta,
  selected = null,
  playing = null,
  isMarked,
  onSelect,
}: {
  line: MushafLine
  meta: MushafMeta
  selected?: AyahRef | null
  playing?: AyahRef | null
  isMarked?: (surah: number, ayah: number) => boolean
  onSelect?: (surah: number, ayah: number) => void
}) {
  if (line.t === 's') {
    return (
      <div className="flex items-center justify-center">
        <div
          className="flex h-[82%] w-full items-center justify-center rounded-md border-2 border-double border-amber-700/60 bg-amber-500/10"
          style={{ fontSize: '1.05em' }}
        >
          {`سورة ${meta.surahNames[line.n - 1]}`}
        </div>
      </div>
    )
  }

  if (line.t === 'b') {
    return <div className="flex items-center justify-center whitespace-nowrap">{meta.basmalah}</div>
  }

  return (
    <div
      className="flex items-center whitespace-nowrap"
      style={{
        justifyContent: line.c ? 'center' : 'space-between',
        columnGap: `${meta.spaceEm}em`,
      }}
    >
      {line.w.map((word, i) => {
        const ayah = line.a[i]
        const isSelected = !!selected && selected.s === line.s && selected.a === ayah
        const isPlaying = !!playing && playing.s === line.s && playing.a === ayah
        const marked = !!isMarked && isAyahMarker(word) && isMarked(line.s, ayah)

        return (
          <span
            key={i}
            onClick={onSelect ? () => onSelect(line.s, ayah) : undefined}
            className={cn(
              'rounded-sm',
              onSelect && 'cursor-pointer',
              isSelected ? 'bg-amber-500/30' : isPlaying ? 'bg-primary/20' : '',
              marked && 'text-amber-600',
            )}
          >
            {word}
          </span>
        )
      })}
    </div>
  )
}
