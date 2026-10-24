import { VersionBadge } from '@/components/version-badge'

export default function AboutPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-white px-6 py-10 dark:bg-zinc-900">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-4xl dark:bg-emerald-900">
            🕌
          </div>
          <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            إسلامي
          </h1>
          {/* المكون الديناميكي لرقم الإصدار */}
          <p className="mt-1">
            <VersionBadge />
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <p className="text-center text-base">
            تطبيق إسلامي شامل يهدف إلى مساعدتك في عبادتك اليومية، ويجمع لك أهم ما يحتاجه
            المسلم في مكان واحد، <strong>مجاناً وبدون إعلانات</strong>.
          </p>

          <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              ✨ مميزات التطبيق
            </h2>
            <ul className="space-y-3">
              <li>🕌 <strong>مواقيت الصلاة:</strong> أوقات دقيقة حسب موقعك مع إشعارات وأذان.</li>
              <li>🧭 <strong>القبلة:</strong> تحديد اتجاه القبلة بسهولة.</li>
              <li>📖 <strong>القرآن الكريم:</strong> مصحف كامل بالرسم العثماني (يعمل بدون إنترنت) مع وضع ليلي، وتكبير، واستماع بعدة قرّاء.</li>
              <li>📊 <strong>متتبع الختمة:</strong> تابع تقدمك في ختم القرآن الكريم بشكل بصري.</li>
              <li>📿 <strong>الأذكار والأدعية:</strong> أذكار الصباح والمساء، حصن المسلم، أسماء الله الحسنى، ومسبحة إلكترونية.</li>
              <li>🔔 <strong>التذكيرات الذكية:</strong> تنبيهات اختيارية للصلاة على النبي وأذكارك اليومية.</li>
              <li>📅 <strong>التقويم:</strong> الهجري والميلادي.</li>
              <li>🧸 <strong>قسم الأطفال:</strong> تعليم مبسط للصغار (قصار السور، أدعية، حروف).</li>
              <li>🌙 <strong>السنن والأنبياء:</strong> السنن الرواتب والمهجورة، ونبذة عن الأنبياء.</li>
              <li>🔖 <strong>العلامات المرجعية:</strong> احفظ موضعك في القرآن وارجع إليه متى شئت.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <h2 className="mb-2 font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
              💚 تطبيق مجاني بالكامل
            </h2>
            <p className="text-emerald-900 dark:text-emerald-200">
              هذا التطبيق مجاني بالكامل، بلا إعلانات، وبلا اشتراكات، وبلا رسوم خفية.
              هدفنا نشر الفائدة والأجر بإذن الله.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              📬 تواصل معنا
            </h2>
            <p>
              اقتراحاتك وملاحظاتك تهمنا دائماً:
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
            نسأل الله أن ينفع به، وأن يجعله في ميزان حسناتنا 🤲
          </p>
        </div>
      </div>
    </main>
  )
}