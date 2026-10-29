import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
}: {
  title: string
  subtitle?: string
  backHref?: string
  action?: React.ReactNode
}) {
  return (
    // ✅ التعديل هنا: استبدلنا pt-4 بـ pt-[max(1rem,env(safe-area-inset-top))]
    // هذا الكود يجبر الصفحة على ترك مسافة لشريط إشعارات الهاتف تلقائياً
    <header className="flex items-center gap-3 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
      {backHref && (
        <Link
          href={backHref}
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border hover:bg-muted"
          aria-label="رجوع"
        >
          <ChevronRight className="size-5" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-balance text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
