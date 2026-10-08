import Link from 'next/link'

export default function Page() {
  const sections = [
    { href: '/prayer', title: 'مواقيت الصلاة', desc: 'أوقات الصلاة حسب موقعك', icon: '🕌' },
    { href: '/qibla', title: 'القبلة', desc: 'اتجاه القبلة بدقة', icon: '🧭' },
    { href: '/quran', title: 'القرآن الكريم', desc: 'اقرأ واستمع للقرآن', icon: '📖' },
    { href: '/adhkar', title: 'الأذكار', desc: 'أذكار الصباح والمساء', icon: '📿' },
    { href: '/calendar', title: 'التقويم', desc: 'التقويم الهجري والميلادي', icon: '📅' },
    { href: '/kids', title: 'قسم الأطفال', desc: 'تعليم الأطفال الإسلام', icon: '🧸' },
    { href: '/guide', title: 'الدليل', desc: 'دليل شامل', icon: '📚' },
    { href: '/more', title: 'المزيد', desc: 'خيارات إضافية', icon: '➕' },
  ]

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-zinc-900 dark:to-black">
      {/* الهيدر */}
      <header className="px-6 pt-10 pb-6 text-center">
        <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
          إسلامي شامل
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          رفيقك في العبادة والذكر
        </p>
      </header>

      {/* الأقسام */}
      <section className="grid grid-cols-2 gap-4 px-4 pb-24 sm:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-white p-4 text-center shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="text-4xl transition group-hover:scale-110">{s.icon}</span>
            <span className="mt-2 font-semibold text-zinc-800 dark:text-zinc-100">
              {s.title}
            </span>
            <span className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {s.desc}
            </span>
          </Link>
        ))}
      </section>
    </main>
  )
}