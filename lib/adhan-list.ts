export interface AdhanVoice {
  id: string
  file: string
  name: string
  reciter: string
}

export const ADHAN_VOICES: AdhanVoice[] = [
  // ✅ التكبيرتان (تنبيه قصير)
  { id: 'takbeeratain', file: 'takbeeratain.mp3', name: 'تكبيرتان (تنبيه قصير)', reciter: 'تنبيه سريع' },

  // ✅ أذان مكة
  { id: 'makkah', file: 'makkah_al_banna.mp3', name: 'أذان مكة المكرمة', reciter: 'الشيخ علي ملا' },

  // ✅ عبد الباسط (الملف الموجود فعلياً)
  { id: 'abdulbasit_cairo', file: 'abdubasit_cairo.mp3', name: 'أذان عبد الباسط (القاهرة)', reciter: 'الشيخ عبد الباسط عبد الصمد' },

  // ✅ مصطفى إسماعيل
  { id: 'mustafa', file: 'mustafa_ismail.mp3', name: 'أذان مصطفى إسماعيل', reciter: 'الشيخ مصطفى إسماعيل' },

  // ✅ محمود البنا
  { id: 'banna', file: 'mahmoud_al_banna.mp3', name: 'أذان محمود البنا', reciter: 'الشيخ محمود علي البنا' },

  // ✅ أحمد نعينع
  { id: 'nuaina', file: 'ahmed-nuaina.mp3', name: 'أذان أحمد نعينع', reciter: 'الشيخ أحمد نعينع' },

  // ✅ ناصر القطامي
  { id: 'qatami', file: 'Nasser_al_Qatami_Adhan.mp3', name: 'أذان ناصر القطامي', reciter: 'الشيخ ناصر القطامي' },

  // ✅ ماجد الحمذاني
  { id: 'hamathani', file: 'Majed_al_Hamathani_Adhan.mp3', name: 'أذان ماجد الحمذاني', reciter: 'الشيخ ماجد الحمذاني' },

  // ✅ أحمد العمادي
  { id: 'imadi', file: 'Ahmed_al_Imadi_Adhan.mp3', name: 'أذان أحمد العمادي', reciter: 'الشيخ أحمد العمادي' },

  // ✅ إسلامي ١
  { id: 'islamcan1', file: 'islamcan.mp3', name: 'أذان إسلامي ١', reciter: 'مؤذن' },

  // ✅ إسلامي ٢
  { id: 'islamcan2', file: 'islamcan1.mp3', name: 'أذان إسلامي ٢', reciter: 'مؤذن' },

  // ✅ إسلامي ٣
  { id: 'islamcan3', file: 'islamcan2.mp3', name: 'أذان إسلامي ٣', reciter: 'مؤذن' },

  // ✅ إسلامي ٤
  { id: 'islamcan4', file: 'islamcan3.mp3', name: 'أذان إسلامي ٤', reciter: 'مؤذن' },

  // ✅ أذان الجمعة (الملف الموجود)
  { id: 'jummah', file: 'ICR_Beautiful_Jummah_2nd_Adhan_ICR_12th_May_2023_22nd_Shawwal_1444_by_Abdullah.mp3', name: 'أذان الجمعة', reciter: 'مؤذن' },

  // ✅ أذان الفجر (اخترنا "أحمد نعينع" كبديل لملف الفجر المفقود)
  { id: 'fajr', file: 'ahmed-nuaina.mp3', name: 'أذان الفجر', reciter: 'الشيخ أحمد نعينع' },
]

export function getAdhanVoice(id: string): AdhanVoice | undefined {
  return (
    ADHAN_VOICES.find((v) => v.id === id) ??
    (id === 'a2' ? ADHAN_VOICES.find((v) => v.id === 'fajr') : ADHAN_VOICES[0])
  )
}

export function voiceIdFor(
  s: {
    adhanVoice: string
    fajrVoice: string
    prayerVoices?: Partial<Record<string, string>>
  },
  prayer: string,
): string {
  const chosen = s.prayerVoices?.[prayer]
  if (chosen) return chosen
  return prayer === 'fajr' ? s.fajrVoice : s.adhanVoice
}