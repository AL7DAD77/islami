'use client'

import Link from 'next/link'
import { Bookmark, BookOpenCheck, ChevronDown, Trash2 } from 'lucide-react'
import { removeBookmark, useBookmarkState } from '@/lib/bookmarks'
import { toArabicNumber } from '@/lib/quran'

export function BookmarksCard() {
  const { bookmarks, position } = useBookmarkState()
  if (!position && bookmarks.length === 0) return null

  return (
    <>
      {position && (
        <Link
          href={`/quran/${position.surah}?ayah=${position.ayah}`}
          className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border hover:bg-secondary"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <BookOpenCheck className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] text-muted-foreground">{'متابعة القراءة'}</span>
            <span className="block truncate font-bold">
              {`سورة ${position.surahName || toArabicNumber(position.surah)} · آية ${toArabicNumber(position.ayah)}`}
            </span>
          </span>
        </Link>
      )}

      {bookmarks.length > 0 && (
        <details className="group rounded-2xl bg-card shadow-sm ring-1 ring-border">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-3 [&::-webkit-details-marker]:hidden">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-gold">
              <Bookmark className="size-5" aria-hidden="true" />
            </span>
            <span className="flex-1 font-bold">{`العلامات المرجعية (${toArabicNumber(bookmarks.length)})`}</span>
            <ChevronDown
              className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <ul className="flex flex-col divide-y divide-border border-t px-3">
            {bookmarks.map((b) => (
              <li key={b.id} className="flex items-center gap-2 py-2">
                <Link href={`/quran/${b.surah}?ayah=${b.ayah}`} className="flex-1 text-sm">
                  {`سورة ${b.surahName || toArabicNumber(b.surah)} · آية ${toArabicNumber(b.ayah)}`}
                </Link>
                <button
                  type="button"
                  onClick={() => removeBookmark(b.id)}
                  aria-label="حذف العلامة"
                  className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  )
}
