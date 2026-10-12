import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/** عنوان قسم خفيف يفصل المجموعات دون بطاقة إضافية */
export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('mb-2.5 px-1 text-sm font-bold text-muted-foreground', className)}>{children}</h2>
}

type Tone = 'card' | 'primary' | 'accent'

const TONES: Record<Tone, { box: string; icon: string; sub: string }> = {
  card: {
    box: 'bg-card ring-1 ring-border hover:bg-secondary',
    icon: 'bg-accent text-accent-foreground',
    sub: 'text-muted-foreground',
  },
  primary: {
    box: 'bg-primary text-primary-foreground',
    icon: 'bg-primary-foreground/15 text-gold',
    sub: 'opacity-80',
  },
  accent: {
    box: 'bg-accent text-accent-foreground ring-1 ring-border',
    icon: 'bg-card/60',
    sub: 'opacity-75',
  },
}

/** بلاط رابط موحّد: أيقونة + عنوان + وصف مختصر (يُستخدم في الشبكات ذات العمودين أو الثلاثة) */
export function TileLink({
  href,
  icon,
  title,
  subtitle,
  tone = 'card',
  layout = 'row',
  chevron = false,
  className,
}: {
  href: string
  icon: React.ReactNode
  title: string
  subtitle?: string
  tone?: Tone
  layout?: 'row' | 'stack'
  chevron?: boolean
  className?: string
}) {
  const t = TONES[tone]
  return (
    <Link
      href={href}
      className={cn(
        'flex rounded-2xl p-3 shadow-sm transition-colors',
        layout === 'stack' ? 'flex-col items-center gap-1.5 py-4 text-center' : 'items-center gap-3',
        t.box,
        className,
      )}
    >
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl text-lg', t.icon)}>{icon}</span>
      <span className={cn('min-w-0', layout === 'row' && 'flex-1')}>
        <span className="line-clamp-2 block text-sm font-bold leading-snug">{title}</span>
        {subtitle && <span className={cn('line-clamp-1 block text-[11px]', t.sub)}>{subtitle}</span>}
      </span>
      {chevron && layout === 'row' && <ChevronLeft className="size-4 shrink-0 opacity-60" aria-hidden="true" />}
    </Link>
  )
}
