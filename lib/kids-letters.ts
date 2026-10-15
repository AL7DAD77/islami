export interface ArabicLetter {
  letter: string
  word: string
  emoji: string
}

// كل حرف مع كلمة إسلامية تبدأ به (حتى يتعلم الطفل الحرف والمعنى معاً)
export const ARABIC_LETTERS: ArabicLetter[] = [
  { letter: 'أ', word: 'الله', emoji: '☝️' },
  { letter: 'ب', word: 'بسم', emoji: '📜' },
  { letter: 'ت', word: 'تسبيح', emoji: '📿' },
  { letter: 'ث', word: 'ثواب', emoji: '⭐' },
  { letter: 'ج', word: 'جنة', emoji: '🌳' },
  { letter: 'ح', word: 'حج', emoji: '🕋' },
  { letter: 'خ', word: 'خير', emoji: '🌟' },
  { letter: 'د', word: 'دعاء', emoji: '🤲' },
  { letter: 'ذ', word: 'ذكر', emoji: '📿' },
  { letter: 'ر', word: 'رحمة', emoji: '💚' },
  { letter: 'ز', word: 'زكاة', emoji: '💰' },
  { letter: 'س', word: 'سجود', emoji: '🙇' },
  { letter: 'ش', word: 'شهادة', emoji: '📜' },
  { letter: 'ص', word: 'صلاة', emoji: '🙏' },
  { letter: 'ض', word: 'ضحى', emoji: '🌅' },
  { letter: 'ط', word: 'طهارة', emoji: '🧼' },
  { letter: 'ظ', word: 'ظهر', emoji: '☀️' },
  { letter: 'ع', word: 'عيد', emoji: '🎉' },
  { letter: 'غ', word: 'غيث', emoji: '🌧️' },
  { letter: 'ف', word: 'فجر', emoji: '🌄' },
  { letter: 'ق', word: 'قرآن', emoji: '📖' },
  { letter: 'ك', word: 'كعبة', emoji: '🕋' },
  { letter: 'ل', word: 'لبيك', emoji: '🙌' },
  { letter: 'م', word: 'مسجد', emoji: '🕌' },
  { letter: 'ن', word: 'نور', emoji: '💡' },
  { letter: 'ه', word: 'هدى', emoji: '🧭' },
  { letter: 'و', word: 'وضوء', emoji: '💧' },
  { letter: 'ي', word: 'يوم', emoji: '📅' },
]
