import type { ReactNode } from 'react'

/** هيكل موحّد لصفحات المزيد القانونية (الخصوصية، إخلاء المسؤولية) */
export function LegalLayout({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main dir="rtl" className="min-h-screen bg-white px-6 py-10 dark:bg-zinc-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">{title}</h1>
        <p className="mb-6 text-xs text-zinc-500 dark:text-zinc-400">{`آخر تحديث: ${updated}`}</p>
        <div className="space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{children}</div>
      </div>
    </main>
  )
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">{title}</h2>
      {children}
    </section>
  )
}

export function Contact() {
  return (
    <p>
      للاستفسار أو طلب الحذف أو التصحيح، راسلنا عبر البريد:{' '}
      <a href="mailto:al7dad77@gmail.com" className="text-emerald-600 underline dark:text-emerald-400">
        al7dad77@gmail.com
      </a>
    </p>
  )
}
