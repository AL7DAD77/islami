export interface KidsDua {
  id: string
  emoji: string
  occasion: string
  text: string
}

export const KIDS_DUAS: KidsDua[] = [
  { id: 'wake', emoji: '🌅', occasion: 'عند الاستيقاظ', text: 'الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور' },
  { id: 'before-food', emoji: '🍽️', occasion: 'قبل الطعام', text: 'بسم الله' },
  { id: 'after-food', emoji: '😋', occasion: 'بعد الطعام', text: 'الحمد لله الذي أطعمني هذا ورزقنيه من غير حول مني ولا قوة' },
  { id: 'before-sleep', emoji: '🌙', occasion: 'قبل النوم', text: 'باسمك اللهم أموت وأحيا' },
  { id: 'wake-up', emoji: '☀️', occasion: 'عند الاستيقاظ للصلاة', text: 'الحمد لله الذي رد علي روحي وعافاني في جسدي وأذن لي بذكره' },
  { id: 'leave-home', emoji: '🚪', occasion: 'عند الخروج من المنزل', text: 'بسم الله، توكلت على الله، ولا حول ولا قوة إلا بالله' },
  { id: 'enter-home', emoji: '🏠', occasion: 'عند دخول المنزل', text: 'اللهم إني أسألك خير المولج وخير المخرج' },
  { id: 'toilet-in', emoji: '🚽', occasion: 'عند دخول الخلاء', text: 'اللهم إني أعوذ بك من الخبث والخبائث' },
  { id: 'toilet-out', emoji: '💧', occasion: 'عند الخروج من الخلاء', text: 'غفرانك' },
  { id: 'sneeze', emoji: '🤧', occasion: 'عند العطاس', text: 'الحمد لله (يقولها العاطس)، يرحمك الله (يقولها السامع)، يهديكم الله ويصلح بالكم (يرد العاطس)' },
  { id: 'travel', emoji: '🚗', occasion: 'عند السفر', text: 'سبحان الذي سخر لنا هذا وما كنا له مقرنين وإنا إلى ربنا لمنقلبون' },
  { id: 'rain', emoji: '🌧️', occasion: 'عند نزول المطر', text: 'اللهم صيباً نافعاً' },
  { id: 'mosque-in', emoji: '🕌', occasion: 'عند دخول المسجد', text: 'اللهم افتح لي أبواب رحمتك' },
  { id: 'mosque-out', emoji: '🚶', occasion: 'عند الخروج من المسجد', text: 'اللهم إني أسألك من فضلك' },
  { id: 'parents', emoji: '👨‍👩‍👧', occasion: 'دعاء للوالدين', text: 'ربِّ ارحمهما كما ربياني صغيراً' },
  { id: 'knowledge', emoji: '📚', occasion: 'دعاء طلب العلم', text: 'ربِّ زدني علماً' },
  { id: 'good', emoji: '🤲', occasion: 'دعاء الخير', text: 'ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار' },
  { id: 'heart', emoji: '💚', occasion: 'دعاء ثبات القلب', text: 'يا مقلب القلوب ثبت قلبي على دينك' },
]