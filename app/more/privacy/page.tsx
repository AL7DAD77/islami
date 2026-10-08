export default function PrivacyPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-white px-6 py-10 dark:bg-zinc-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
          سياسة الخصوصية
        </h1>

        <div className="space-y-5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <p>
            نحن في تطبيق <strong>«إسلامي»</strong> نحترم خصوصيتك ونلتزم بحماية بياناتك.
            توضح هذه السياسة كيفية تعاملنا مع المعلومات عند استخدامك للتطبيق.
          </p>

          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            المعلومات التي نجمعها
          </h2>
          <p>
            <strong>لا نجمع أي معلومات شخصية</strong> مثل الاسم أو البريد الإلكتروني أو
            رقم الهاتف.
          </p>
          <p>
            قد يطلب التطبيق <strong>الوصول إلى موقعك الجغرافي</strong> فقط لتحديد مواقيت
            الصلاة واتجاه القبلة بدقة. هذا الإذن اختياري ويمكنك رفضه، ويعمل التطبيق حينها
            بمواقيت افتراضية.
          </p>

          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            كيف نستخدم المعلومات
          </h2>
          <ul className="list-inside list-disc space-y-1">
            <li>تحديد مواقيت الصلاة حسب موقعك.</li>
            <li>تحديد اتجاه القبلة بدقة.</li>
            <li>تحسين تجربة الاستخدام داخل التطبيق.</li>
          </ul>

          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            مشاركة البيانات
          </h2>
          <p>
            <strong>لا نشارك أي بيانات</strong> مع أي طرف ثالث. جميع المعلومات تبقى على
            جهازك فقط.
          </p>

          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            الإعلانات
          </h2>
          <p>
            التطبيق <strong>مجاني بالكامل وخالٍ من الإعلانات</strong>، ولا نستخدم أي أدوات
            تتبع إعلانية.
          </p>

          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            أمان البيانات
          </h2>
          <p>
            نحرص على حماية بياناتك، ولا نحتفظ بأي معلومات على سيرفرات خارجية.
          </p>

          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            خصوصية الأطفال
          </h2>
          <p>
            التطبيق مناسب لجميع الأعمار، ولا نجمع أي بيانات من الأطفال أو غيرهم.
          </p>

          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            التغييرات في السياسة
          </h2>
          <p>
            قد نحدّث سياسة الخصوصية من وقت لآخر. سيتم نشر أي تغييرات على هذه الصفحة.
          </p>

          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            التواصل
          </h2>
          <p>
            لأي استفسار بخصوص سياسة الخصوصية، تواصل معنا عبر:
            <br />
            <a
              href="mailto:al7dad77@gmail.com"
              className="text-emerald-600 underline dark:text-emerald-400"
            >
              al7dad77@gmail.com
            </a>
          </p>

          <p className="pt-4 text-xs text-zinc-500 dark:text-zinc-400">
            آخر تحديث: 2026
          </p>
        </div>
      </div>
    </main>
  )
}