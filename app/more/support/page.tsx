'use client'

import { useLanguage } from '@/lib/language-context'

export default function SupportPage() {
  const { dict } = useLanguage()

  return (
    <main className="min-h-screen bg-white px-6 py-10 dark:bg-zinc-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
          {dict.supportPage.title}
        </h1>

        <div className="space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <p>
            {dict.supportPage.intro}
          </p>

          {/* البريد الإلكتروني */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📧</span>
              <div>
                <h2 className="font-semibold text-zinc-800 dark:text-zinc-100">
                  {dict.supportPage.emailTitle}
                </h2>
                <a
                  href="mailto:al7dad77@gmail.com"
                  className="text-emerald-600 underline dark:text-emerald-400"
                >
                  al7dad77@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* أنواع الدعم */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              {dict.supportPage.howCanWeHelp}
            </h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span>🐛</span>
                <span>{dict.supportPage.helpItems[0]}</span>
              </li>
              <li className="flex items-start gap-2">
                <span>💡</span>
                <span>{dict.supportPage.helpItems[1]}</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📖</span>
                <span>{dict.supportPage.helpItems[2]}</span>
              </li>
              <li className="flex items-start gap-2">
                <span>⚖️</span>
                <span>{dict.supportPage.helpItems[3]}</span>
              </li>
            </ul>
          </div>

          {/* وقت الرد */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 font-semibold text-zinc-800 dark:text-zinc-100">
              {dict.supportPage.responseTimeTitle}
            </h2>
            <p>
              {dict.supportPage.responseTimeDesc}
            </p>
          </div>

          <p className="pt-2 text-center text-base font-medium text-emerald-700 dark:text-emerald-400">
            {dict.supportPage.footer}
          </p>
        </div>
      </div>
    </main>
  )
}