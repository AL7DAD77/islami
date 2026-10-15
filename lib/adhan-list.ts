export interface AdhanVoice {
  id: string
  file: string
  name: string
  reciter: string
}

export const ADHAN_VOICES: AdhanVoice[] = [
  { id: 'makkah', file: 'makkah_al_banna.mp3', name: 'أذان مكة المكرمة', reciter: 'الشيخ علي ملا' },
  { id: 'abdulbasit', file: 'abdubasit.mp3', name: 'أذان عبد الباسط', reciter: 'الشيخ عبد الباسط عبد الصمد' },
  { id: 'abdulbasit_cairo', file: 'abdubasit_cairo.mp3', name: 'أذان القاهرة', reciter: 'الشيخ عبد الباسط' },
  { id: 'mustafa', file: 'mustafa_ismail.mp3', name: 'أذان مصطفى إسماعيل', reciter: 'الشيخ مصطفى إسماعيل' },
  { id: 'banna', file: 'mahmoud_al_banna.mp3', name: 'أذان محمود البنا', reciter: 'الشيخ محمود علي البنا' },
  { id: 'nuaina', file: 'ahmed-nuaina.mp3', name: 'أذان أحمد نعينع', reciter: 'الشيخ أحمد نعينع' },
  { id: 'qatami', file: 'Nasser_al_Qatami_Adhan.mp3', name: 'أذان ناصر القطامي', reciter: 'الشيخ ناصر القطامي' },
  { id: 'hamathani', file: 'Majed_al_Hamathani_Adhan.mp3', name: 'أذان ماجد الحمذاني', reciter: 'الشيخ ماجد الحمذاني' },
  { id: 'imadi', file: 'Ahmed_al_Imadi_Adhan.mp3', name: 'أذان أحمد العمادي', reciter: 'الشيخ أحمد العمادي' },
  { id: 'fajr', file: 'SheikhAfeefi_Fajr_2-4-12.mp3', name: 'أذان الفجر', reciter: 'الشيخ عفيفي' },
  { id: 'islamcan1', file: 'islamcan.mp3', name: 'أذان إسلامي ١', reciter: 'مؤذن' },
  { id: 'islamcan2', file: 'islamcan1.mp3', name: 'أذان إسلامي ٢', reciter: 'مؤذن' },
  { id: 'islamcan3', file: 'islamcan2.mp3', name: 'أذان إسلامي ٣', reciter: 'مؤذن' },
  { id: 'islamcan4', file: 'islamcan3.mp3', name: 'أذان إسلامي ٤', reciter: 'مؤذن' },
]

export function getAdhanVoice(id: string): AdhanVoice | undefined {
  // إن كان المعرّف قديماً أو غير صالح (مثل a1/a2) نرجع الصوت الافتراضي بدل عدم تشغيل أي صوت
  return ADHAN_VOICES.find((v) => v.id === id) ?? (id === 'a2' ? ADHAN_VOICES.find((v) => v.id === 'fajr') : ADHAN_VOICES[0])
}

/** صوت الصلاة: اختيار الشخص لصلاة بعينها إن وُجد، وإلا الافتراضي (الفجر له صوته الافتراضي) */
export function voiceIdFor(
  s: { adhanVoice: string; fajrVoice: string; prayerVoices?: Partial<Record<string, string>> },
  prayer: string,
): string {
  const chosen = s.prayerVoices?.[prayer]
  if (chosen) return chosen
  return prayer === 'fajr' ? s.fajrVoice : s.adhanVoice
}
