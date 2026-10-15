import Link from 'next/link'
import { Search } from 'lucide-react'

/** زر بحث صغير في ترويسة الصفحات الرئيسية، يفتح البحث في محتوى التطبيق */
export function SearchButton() {
  return (
    <Link
      href="/search"
      aria-label="بحث"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border hover:bg-muted"
    >
      <Search className="size-5" aria-hidden="true" />
    </Link>
  )
}
