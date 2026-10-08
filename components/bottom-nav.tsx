'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Clock, Home, LayoutGrid, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/prayer', label: 'الصلاة', icon: Clock },
  { href: '/quran', label: 'القرآن', icon: BookOpen },
  { href: '/adhkar', label: 'الأذكار', icon: Sparkles },
  { href: '/more', label: 'المزيد', icon: LayoutGrid },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="التنقل الرئيسي"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
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
                  'flex flex-col items-center gap-1 py-2.5 text-xs transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className={cn('rounded-full px-4 py-1 transition-colors', active && 'bg-secondary')}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className={cn(active && 'font-bold')}>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
