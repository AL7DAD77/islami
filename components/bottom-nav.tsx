'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Clock, Compass, LayoutGrid, Sparkles, Baby } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/prayer', label: 'الصلاة', icon: Clock },
  { href: '/quran', label: 'القرآن', icon: BookOpen },
  { href: '/adhkar', label: 'الأذكار', icon: Sparkles },
  { href: '/kids', label: 'الأطفال', icon: Baby },
  { href: '/qibla', label: 'القبلة', icon: Compass },
  { href: '/more', label: 'المزيد', icon: LayoutGrid },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg"
    >
      <ul className="mx-auto flex max-w-2xl items-stretch justify-around">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 text-[10px] transition-all duration-200',
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