'use client'

import { useLanguage } from '@/lib/language-context'

export default function SeerahPage() {
  const { locale } = useLanguage()
  const isAr = locale === 'ar'

  const seerahChapters = isAr ? [
    { id: 1, title: "الفصل الأول: المولد والنشأة", content: "وُلد النبي محمد صلى الله عليه وسلم في مكة عام الفيل (حوالي 570 ميلادية). توفي والده عبد الله قبل ولادته، وتوفيت أمه آمنة وهو في السادسة من عمره، فكفله جده عبد المطلب ثم عمه أبو طالب. عمل في رعي الغنم ثم في التجارة، وعُرف بين قومه بالصادق الأمين." },
    { id: 2, title: "الفصل الثاني: البعثة والرسالة", content: "في سن الأربعين، وفي غار حراء بجبل النور، نزل عليه جبريل عليه السلام بأول آيات القرآن الكريم: (اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ). بدأ بدعوة الناس إلى عبادة الله وحده ونبذ الأصنام سراً، ثم جهر بالدعوة فتعرض هو وأصحابه لأذى شديد من قريش، فصبروا واحتسبوا." },
    { id: 3, title: "الفصل الثالث: الهجرة إلى المدينة", content: "بعد سنوات من الدعوة والصبر، وبعد بيعتي العقبة الأولى والثانية، أذن الله لنبيه بالهجرة إلى يثرب (المدينة المنورة). هاجر النبي صلى الله عليه وسلم مع صديقه أبي بكر الصديق، مخلفين وراءهم مكة بعد مؤامرة قريش لقتله. أسس في المدينة مجتمعاً إسلامياً قائماً على الأخوة والعدل." },
    { id: 4, title: "الفصل الرابع: الغزوات والفتوحات", content: "خاض المسلمون بقيادة النبي صلى الله عليه وسلم عدة غزوات دفاعاً عن الدين والدولة الإسلامية، منها غزوة بدر الكبرى (أول انتصار)، وغزوة أحد، وغزوة الخندق. ثم توالت الفتوحات حتى فتح الله على المسلمين مكة المكرمة في العام الثامن للهجرة، فدخل الناس في دين الله أفواجاً." },
    { id: 5, title: "الفصل الخامس: حجة الوداع والوفاة", content: "في العام العاشر للهجرة، حج النبي صلى الله عليه وسلم حجته الأخيرة (حجة الوداع) وخطب في الناس خطبة جامعة أوصاهم فيها بالقرآن والسنة. ثم مرض صلى الله عليه وسلم وتوفي في شهر ربيع الأول من العام الحادي عشر للهجرة، ودفن في حجرة السيدة عائشة رضي الله عنها في المسجد النبوي." }
  ] : [
    { id: 1, title: "Chapter 1: Birth and Upbringing", content: "Prophet Muhammad (PBUH) was born in Makkah in the Year of the Elephant (around 570 CE). His father Abdullah died before his birth, and his mother Aminah died when he was six years old, so his grandfather Abdul Muttalib then his uncle Abu Talib took care of him. He worked in sheep herding then in trade, and was known among his people as the truthful and trustworthy." },
    { id: 2, title: "Chapter 2: The Mission and Message", content: "At the age of forty, in the Cave of Hira on Mount Nur, Gabriel (PBUH) descended upon him with the first verses of the Holy Quran: (Read in the name of your Lord who created). He began calling people to worship Allah alone and abandon idols secretly, then proclaimed the call, and he and his companions faced severe harm from Quraysh, but they were patient and sought reward." },
    { id: 3, title: "Chapter 3: Migration to Madinah", content: "After years of calling and patience, and after the first and second pledges of Aqabah, Allah permitted His Prophet to migrate to Yathrib (Madinah). The Prophet (PBUH) migrated with his friend Abu Bakr Al-Siddiq, leaving Makkah behind after Quraysh's plot to kill him. He established in Madinah an Islamic society based on brotherhood and justice." },
    { id: 4, title: "Chapter 4: Battles and Conquests", content: "Muslims under the leadership of the Prophet (PBUH) fought several battles in defense of the religion and the Islamic state, including the Great Battle of Badr (the first victory), the Battle of Uhud, and the Battle of the Trench. Conquests continued until Allah granted Muslims the conquest of Makkah in the eighth year of Hijrah, and people entered the religion of Allah in multitudes." },
    { id: 5, title: "Chapter 5: Farewell Pilgrimage and Death", content: "In the tenth year of Hijrah, the Prophet (PBUH) performed his last pilgrimage (Farewell Pilgrimage) and delivered a comprehensive sermon to the people, advising them with the Quran and Sunnah. Then he (PBUH) fell ill and died in the month of Rabi' Al-Awwal in the eleventh year of Hijrah, and was buried in the room of Aisha (may Allah be pleased with her) in the Prophet's Mosque." }
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8 text-emerald-600 dark:text-emerald-400">
        {isAr ? 'السيرة النبوية' : 'Prophetic Biography'}
      </h1>
      <p className="text-center text-muted-foreground mb-10">
        {isAr ? 'سيرة النبي محمد صلى الله عليه وسلم مقسمة إلى فصول' : 'The biography of Prophet Muhammad (PBUH) divided into chapters'}
      </p>

      <div className="space-y-6">
        {seerahChapters.map((chapter) => (
          <div 
            key={chapter.id} 
            className="bg-card p-6 rounded-lg shadow-md border-r-4 border-emerald-500 hover:bg-secondary transition-colors ring-1 ring-border"
          >
            <h2 className="text-xl font-bold mb-3 text-emerald-700 dark:text-emerald-400">
              {chapter.title}
            </h2>
            <p className="text-foreground leading-relaxed text-lg">
              {chapter.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}