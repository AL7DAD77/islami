'use client'

import { useLanguage } from '@/lib/language-context'
import { VersionBadge } from '@/components/version-badge'

export default function AboutPage() {
  const { dict, locale } = useLanguage()
  const isAr = locale === 'ar'

  const content = isAr ? {
    tagline: "تطبيق إسلامي شامل يهدف إلى مساعدتك في عبادتك اليومية، ويجمع لك أهم ما يحتاجه المسلم في مكان واحد، مجاناً وبدون إعلانات.",
    featuresTitle: "✨ مميزات التطبيق",
    features: [
      "🕌 مواقيت الصلاة: أوقات دقيقة حسب موقعك مع إشعارات وأذان.",
      "🧭 القبلة: تحديد اتجاه القبلة بسهولة.",
      "📖 القرآن الكريم: مصحف كامل بالرسم العثماني (يعمل بدون إنترنت) مع وضع ليلي، وتكبير، واستماع بعدة قرّاء.",
      "📊 متتبع الختمة: تابع تقدمك في ختم القرآن الكريم بشكل بصري.",
      "📿 الأذكار والأدعية: أذكار الصباح والمساء، حصن المسلم، أسماء الله الحسنى، ومسبحة إلكترونية.",
      "🔔 التذكيرات الذكية: تنبيهات اختيارية للصلاة على النبي وأذكارك اليومية.",
      "📅 التقويم: الهجري والميلادي.",
      "🧸 قسم الأطفال: تعليم مبسط للصغار (قصار السور، أدعية، حروف).",
      "🌙 السنن والأنبياء: السنن الرواتب والمهجورة، ونبذة عن الأنبياء.",
      "🔖 العلامات المرجعية: احفظ موضعك في القرآن وارجع إليه متى شئت."
    ],
    freeTitle: "💚 تطبيق مجاني بالكامل",
    freeDesc: "هذا التطبيق مجاني بالكامل، بلا إعلانات، وبلا اشتراكات، وبلا رسوم خفية. هدفنا نشر الفائدة والأجر بإذن الله.",
    contactTitle: "📬 تواصل معنا",
    contactDesc: "اقتراحاتك وملاحظاتك تهمنا دائماً:",
    footer: "نسأل الله أن ينفع به، وأن يجعله في ميزان حسناتنا 🤲"
  } : {
    tagline: "A comprehensive Islamic app to help you in your daily worship, gathering what a Muslim needs in one place, free and ad-free.",
    featuresTitle: "✨ App Features",
    features: [
      "🕌 Prayer Times: Accurate times based on your location with notifications and Adhan.",
      "🧭 Qibla: Easily find the Qibla direction.",
      "📖 Holy Quran: Full Mushaf in Uthmani script (works offline) with dark mode, zoom, and listening to multiple reciters.",
      "📊 Khatmah Tracker: Visually track your progress in finishing the Quran.",
      "📿 Adhkar & Duas: Morning and evening adhkar, Hisn Al-Muslim, Names of Allah, and electronic tasbih.",
      "🔔 Smart Reminders: Optional alerts for Salawat on the Prophet and your daily adhkar.",
      "📅 Calendar: Hijri and Gregorian.",
      "🧸 Kids Corner: Simplified education for children (short surahs, duas, letters).",
      "🌙 Sunnah & Prophets: Regular and abandoned sunnahs, and an overview of the prophets.",
      "🔖 Bookmarks: Save your place in the Quran and return to it anytime."
    ],
    freeTitle: "💚 Completely Free App",
    freeDesc: "This app is completely free, with no ads, no subscriptions, and no hidden fees. Our goal is to spread benefit and reward, by Allah's permission.",
    contactTitle: "📬 Contact Us",
    contactDesc: "Your suggestions and feedback are always important to us:",
    footer: "We ask Allah to benefit others through it and make it in our scale of good deeds 🤲"
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 dark:bg-zinc-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-4xl dark:bg-emerald-900">
            🕌
          </div>
          <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {isAr ? 'إسلامي' : 'Islami'}
          </h1>
          <p className="mt-1">
            <VersionBadge />
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <p className="text-center text-base">
            {content.tagline}
          </p>

          <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              {content.featuresTitle}
            </h2>
            <ul className="space-y-3">
              {content.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <h2 className="mb-2 font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
              {content.freeTitle}
            </h2>
            <p className="text-emerald-900 dark:text-emerald-200">
              {content.freeDesc}
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              {content.contactTitle}
            </h2>
            <p>
              {content.contactDesc}
              <br />
              <a
                href="mailto:al7dad77@gmail.com"
                className="text-emerald-600 font-bold underline dark:text-emerald-400"
              >
                al7dad77@gmail.com
              </a>
            </p>
          </div>

          <p className="pt-6 text-center text-sm text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
            {content.footer}
          </p>
        </div>
      </div>
    </main>
  )
}