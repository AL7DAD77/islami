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
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            الإصدار 1.0.5 (6)
          </p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <p className="text-center">
            تطبيق إسلامي شامل يهدف إلى مساعدتك في عبادتك اليومية، ويجمع لك أهم ما يحتاجه
            المسلم في مكان واحد، <strong>مجاناً وبدون إعلانات</strong>.
          </p>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              ✨ مميزات التطبيق
            </h2>
            <ul className="space-y-2">
              <li>🕌 <strong>مواقيت الصلاة:</strong> أوقات دقيقة حسب موقعك.</li>
              <li>🧭 <strong>القبلة:</strong> تحديد اتجاه القبلة بسهولة.</li>
              <li>📖 <strong>القرآن الكريم:</strong> قراءة واستماع بعدة قرّاء.</li>
              <li>📿 <strong>الأذكار:</strong> أذكار الصباح والمساء، وحصن المسلم كاملاً، وأذكار متنوعة.</li>
              <li>📅 <strong>التقويم:</strong> الهجري والميلادي.</li>
              <li>🧸 <strong>قسم الأطفال:</strong> تعليم مبسط للصغار.</li>
              <li>🌙 <strong>السنن والأنبياء:</strong> السنن الرواتب والمهجورة، ونبذة عن الأنبياء.</li>
              <li>🤲 <strong>الأدعية والتسبيح:</strong> أدعية مأثورة ومسبحة إلكترونية.</li>
              <li>🔖 <strong>العلامات المرجعية:</strong> احفظ موضعك في القرآن وارجع إليه متى شئت.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 font-semibold text-zinc-800 dark:text-zinc-100">
              💚 تطبيق مجاني بالكامل
            </h2>
            <p>
              هذا التطبيق مجاني بالكامل، بلا إعلانات، وبلا اشتراكات، وبلا رسوم خفية.
              هدفنا نشر الفائدة والأجر بإذن الله.
            </p>
          </div>


          <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="mb-2 font-semibold text-zinc-800 dark:text-zinc-100">
              📚 مصادر المحتوى
            </h2>
            <p>
              <strong>المصحف بصفحاته:</strong> الخط KFGQPC HAFS Uthmanic Script (الإصدار 2.2) من مجمع
              الملك فهد لطباعة المصحف الشريف بالمدينة المنورة، وحقوقه محفوظة للمجمع، ويُستخدم دون أي
              تعديل وفق ترخيصه المجاني المرفق مع الخط. ونص المصحف وتخطيط صفحاته (١٥ سطراً) من مكتبة
              Quranic Universal Library (QUL) من Tarteel.
            </p>
            <p className="mt-2">
              <strong>حصن المسلم:</strong> نصوصه من كتاب «حصن المسلم من أذكار الكتاب والسنة» لسعيد بن علي
              بن وهف القحطاني، عبر ملف JSON منشور على GitHub بواسطة rn0x (مستودع Adhkar-json)، وصاحب
              الملف يتيح استخدامه مجاناً. حقوق الكتاب لمؤلفه. ولم يتضمن المصدر تخريج الأحاديث، ونوصي
              بمراجعة الأذكار مع أهل العلم.
            </p>
            <p className="mt-2">وإن لاحظت خطأً في أي نص فنرجو إبلاغنا.</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              📬 تواصل معنا
            </h2>
            <p>
              اقتراحاتك تهمنا:
              <br />
              <a
                href="mailto:al7dad77@gmail.com"
                className="text-emerald-600 underline dark:text-emerald-400"
              >
                al7dad77@gmail.com
              </a>
            </p>
          </div>

          <p className="pt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
            نسأل الله أن ينفع به، وأن يجعله في ميزان حسناتنا 🤲
          </p>
        </div>
      </div>
    </main>
  )
}