'use client'
import { ThemeToggle } from '@/components/theme-toggle'
import Link from 'next/link'
import { useState } from 'react'

// ⚠️ ضع رابط التطبيق الحقيقي على Google Play هنا لاحقاً
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.islami.app'

export default function MorePage() {
  const [copied, setCopied] = useState(false)

  const links = [
    { href: '/more/support', title: 'الدعم والتواصل', desc: 'تواصل معنا لأي استفسار', icon: '📞' },
    { href: '/more/privacy', title: 'سياسة الخصوصية', desc: 'كيف نحمي بياناتك', icon: '🔒' },
    { href: '/more/disclaimer', title: 'إخلاء المسؤولية', desc: 'حقوق الملكية والنشر', icon: '⚖️' },
    { href: '/more/about', title: 'عن التطبيق', desc: 'معلومات عن التطبيق', icon: 'ℹ️' },
  ]

  // دالة التقييم
  const handleRate = () => {
    window.open(PLAY_STORE_URL, '_blank')
  }

  // دالة المشاركة
  const handleShare = async () => {
    const shareData = {
      title: 'إسلامي',
      text: 'تطبيق إسلامي شامل: مواقيت الصلاة، القرآن، الأذكار، القبلة. مجاني وبدون إعلانات!',
      url: PLAY_STORE_URL,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // بديل: نسخ الرابط
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // المستخدم ألغى المشاركة، لا نفعل شيء
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-zinc-900 dark:to-black">
      <header className="px-6 pt-10 pb-6 text-center">
        <h1 className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
          المزيد
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          خيارات ومعلومات إضافية
        </p>
      </header>

      <section className="mx-auto max-w-2xl space-y-3 px-4 pb-24">
        <ThemeToggle/>
        {/* زر التقييم */}
        <button
          onClick={handleRate}
          className="flex w-full items-center gap-4 rounded-2xl border border-amber-100 bg-white p-4 text-right shadow-sm transition hover:border-amber-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <span className="text-3xl">⭐</span>
          <div className="flex-1">
            <div className="font-semibold text-zinc-800 dark:text-zinc-100">
              قيّم التطبيق
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              رأيك يساعدنا على التحسين
            </div>
          </div>
          <span className="text-zinc-400">‹</span>
        </button>

        {/* زر المشاركة */}
        <button
          onClick={handleShare}
          className="flex w-full items-center gap-4 rounded-2xl border border-blue-100 bg-white p-4 text-right shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
        >
          <span className="text-3xl">📤</span>
          <div className="flex-1">
            <div className="font-semibold text-zinc-800 dark:text-zinc-100">
              {copied ? 'تم نسخ الرابط ✅' : 'شارك التطبيق'}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              انشر الخير بين أصدقائك
            </div>
          </div>
          <span className="text-zinc-400">‹</span>
        </button>

        {/* باقي الأزرار */}
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="text-3xl">{item.icon}</span>
            <div className="flex-1">
              <div className="font-semibold text-zinc-800 dark:text-zinc-100">
                {item.title}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {item.desc}
              </div>
            </div>
            <span className="text-zinc-400">‹</span>
          </Link>
        ))}
      </section>
    </main>
  )
}