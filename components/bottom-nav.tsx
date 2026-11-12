'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Clock, Compass, LayoutGrid, Sparkles, BookMarked } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language-context'

const ITEMS = [
  { href: '/prayer', key: 'prayer', icon: Clock, also: ['/calendar'] },
  { href: '/quran', key: 'quran', icon: BookOpen, also: [] as string[] },
  { href: '/adhkar', key: 'adhkar', icon: Sparkles, also: ['/tasbih'] },
  { href: '/sahihayn', key: 'sahihayn', icon: BookMarked, also: ['/hadith'] },
  { href: '/qibla', key: 'qibla', icon: Compass, also: [] as string[] },
  { href: '/more', key: 'more', icon: LayoutGrid, also: ['/seerah', '/prophets', '/sunan', '/guide'] },
]

const matches = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(base + '/')

export function BottomNav() {
  const pathname = usePathname()
  const { dict } = useLanguage()

  return (
    <nav
      aria-label={dict.nav.more === 'More' ? 'Main Navigation' : 'التنقل الرئيسي'}
      className="app-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {ITEMS.map(({ href, key, icon: Icon, also }) => {
          const active = matches(pathname, href) || also.some((b) => matches(pathname, b))
          const label = (dict.nav as any)[key] || (key === 'sahihayn' ? 'الصحيحين' : key)

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                replace // ✅ استبدال الصفحة في السجل بدل الإضافة إليه
                scroll={false}
                onClick={(e) => {
                  if (pathname === href) {
                    e.preventDefault()
                  }
                }}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 text-[10px] transition-all duration-200 select-none',
                  active ? 'text-gold' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 items-center justify-center rounded-2xl transition-all duration-200',
                    active && 'scale-110 bg-gold/15',
                  )}
                >
                  <Icon
                    className={cn('size-5 transition-all', active && 'stroke-[2.5]')}
                    aria-hidden="true"
                  />
                </span>
                <span className={cn('transition-all', active && 'font-bold')}>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}