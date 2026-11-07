'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Locale = 'ar' | 'en'

export interface Dictionary {
  nav: {
    more: string
    qibla: string
    kids: string
    adhkar: string
    quran: string
    prayer: string
  }

  common: {
    settings: string
    share: string
    close: string
    save: string
    cancel: string
  }

  settings: {
    prayer: {
      title: string
      subtitle: string
    }
  }

  prayerPage: {
    title: string
    subtitle: string
    adhanSound: string
    weekTimes: string
    calendarLabel: string
  }

  prayers: {
    fajr: string
    sunrise: string
    dhuhr: string
    asr: string
    maghrib: string
    isha: string
  }

  morePage: {
    title: string
    subtitle: string
    tools: string
    learn: string
    appSettings: string
    support: string
    about: string
    quran: string
    hadith: string
    sahihayn: string
    seerah: string
    prophets: string
    sunan: string
    guide: string
    calendar: string
    ibadati: string
    search: string
    reminders: string
    prayerSettings: string
    rate: string
    share: string
    qr: string
    exit: string
    supportTile: string
    aboutApp: string
    privacy: string
    disclaimer: string
  }

  morePageExtra: {
    copied: string
    copyLink: string
  }

  quranPage: {
    title: string
    subtitle: string
    dailyWird: string
    dailyWirdDesc: string
    reciters: string
    recitersDesc: string
    surahIndex: string
  }

  adhkarPage: {
    title: string
    subtitle: string
    tasbih: string
    tasbihDesc: string
    hisn: string
    ruqyah: string
    daily: string
    situations: string
    dua: string
    asmaulHusna: string
    asmaulHusnaDesc: string
    footer: string
    dhikrCount: string
    babCount: string
  }

  dhikrList: {
    completed: string
    of: string
    reset: string
    done: string
    goal: string
    time: string
    nextIn: string
    after: string
    seconds: string
    goNow: string
    stayHere: string
    lastSection: string
    shareDhikr: string
  }

  surahList: {
    surah: string
    ayahs: string
    meccan: string
    medinan: string
  }

  qiblaPage: {
    title: string
    subtitle: string
    verse: string
    verseSource: string
    north: string
    east: string
    south: string
    west: string
    kaaba: string
    qiblaDir: string
    fromNorth: string
    distanceToMakkah: string
    km: string
    facingQibla: string
    startCompass: string
    calibrate: string
    sensorError: string
    permissionError: string
    instructions: string
  }

  kidsPage: {
    title: string
    subtitle: string
    shortSurahs: string
    quiz: string
    duas: string
    letters: string
    lessons: string
    wellDone: string
    of: string
    playAgain: string
    question: string
    options: string
    source: string
  }

  weekPrayerTimes: {
    today: string
    days: Record<string, string>
    months: Record<string, string>
  }

  locationBanner: {
    notDetermined: string
    message: string
    messageEnd: string
    openSettings: string
  }

  ibadatiCard: {
    title: string
    dailyTracking: string
    todayProgress: string
  }

  notificationPrompt: {
    title: string
    desc: string
    enable: string
    successTitle: string
    successBody: string
  }

  adhanSettingsPage: {
    title: string
    subtitle: string
  }

  adhanSettings: {
    batteryTitle: string
    batteryDesc: string
    batteryButton: string
    perPrayerTitle: string
    perPrayerDesc: string
    adhanFor: string
    useDefault: string
    play: string
    stop: string
    defaultVoiceTitle: string
    defaultVoiceSelect: string
  }

  hijriCalendar: {
    prevMonth: string
    nextMonth: string
    monthOccasions: string
    noOccasions: string
    calendarNote: string
    weekdays: Record<string, string>
  }

  ibadatiPage: {
    title: string
    subtitle: string
    todayProgress: string
    of: string
    saveNotice: string
    groups: {
      prayer: string
      dhikr: string
      quran: string
    }
    dailyChallenge: string
    items: Record<string, string>
    challenges: string[]
  }

  legal: {
    privacy: {
      title: string
      updated: string
    }
    disclaimer: {
      title: string
      updated: string
    }
  }

  supportPage: {
    title: string
    intro: string
    emailTitle: string
    howCanWeHelp: string
    helpItems: string[]
    responseTimeTitle: string
    responseTimeDesc: string
    footer: string
  }

  remindersPage: {
    title: string
    subtitle: string
    exactAlarmTitle: string
    exactAlarmDesc: string
    exactAlarmButton: string
    salawatTitle: string
    salawatDesc: string
    reminderEvery: string
    customize: string
    back: string
    save: string
    saving: string
    tone: string
    adhkarTitle: string
    adhkarDesc: string
    intervals: Record<string, string>
    sounds: Record<string, string>
    errors: {
      invalidMinutes: string
      invalidNumber: string
      audioNotFound: string
      scheduleError: string
    }
  }

  themeToggle: {
    lightMode: string
    darkMode: string
    switchTheme: string
  }

  dailyMessageToggle: {
    title: string
    active: string
    inactive: string
  }

  searchPage: {
    title: string
    subtitle: string
    placeholder: string
    srLabel: string
    noResults: string
  }

  hadithPage: {
    title: string
    subtitle: string
    searchPlaceholder: string
    all: string
    noResults: string
    source: string
    explanation: string
    closeHint: string
  }

  ghazawatPage: {
    title: string
    subtitle: string
    lesson: string
    footer: string
  }

  asmaulHusnaPage: {
    title: string
    subtitle: string
    closeHint: string
  }

  hisnPage: {
    title: string
    babCount: string
    dhikrCount: string
    footer: string
  }

  prophetsPage: {
    title: string
    subtitle: string
    peaceBeUponHim: string
    footer: string
  }

  sunanPage: {
    title: string
    subtitle: string
    rawatibTitle: string
    rakaat: string
    sunnahOf: string
    forgottenTitle: string
    forgottenDesc: string
    source: string
    footer: string
  }

  guidePage: {
    title: string
    subtitle: string
  }

  prayerSettingsPage: {
    location: string
    currentCity: string
    detectLocation: string
    detecting: string
    manualSelect: string
    searchCityPlaceholder: string
    calcMethod: string
    asrMadhab: string
    shafiMalikiHanbali: string
    hanafi: string
    adhanActivation: string
    adhanSelectPrayers: string
    notifications: string
    persistentNotification: string
    persistentNotificationDesc: string
    vibration: string
    vibrationDesc: string
    overlayPermission: string
    overlayPermissionDesc: string
    enable: string
    appLanguage: string
    appLanguageDesc: string
    preAdhanTitle: string
    preAdhanEnable: string
    preAdhanEnableDesc: string
    preAdhanMinutesTitle: string
    preAdhanMinutes: Record<string, string>
    methods: Record<string, string>
    alerts: {
      locationDenied: string
      locationDeniedWeb: string
      locationError: string
      notificationError: string
      overlayManual: string
    }
  }

  quranComponents: {
    bookmarks: {
      continueReading: string
      surahLabel: string
      pageLabel: string
      bookmarksTitle: string
      deleteAria: string
    }
    lastPlayed: {
      continueListening: string
      hideAria: string
      surahPrefix: string
    }
    khatmah: {
      title: string
      startJourney: string
      youAreAtPage: string
      completedKhatmah: string
      pagesRemaining: string
      duaTitle: string
      duaSubtitle: string
    }
    khatmahDuaPage: {
      title: string
      subtitle: string
      footer: string
    }
    recitersBrowser: {
      searchPlaceholder: string
      noResults: string
      defaultReciter: string
      moshafMurattal: string
    }
  }

  sahihaynPage: {
    title: string
    subtitle: string
    bukhari: string
    muslim: string
    chapters: string
    searchPlaceholder: string
    noResults: string
    source: string
    sourceValue: string
    disclaimer: string
    hadithNumber: string
    narrator: string
  }
}

const ARABIC_DICTIONARY: Dictionary = {
  nav: {
    more: 'المزيد',
    qibla: 'القبلة',
    kids: 'الأطفال',
    adhkar: 'الأذكار',
    quran: 'القرآن',
    prayer: 'الصلاة',
  },

  common: {
    settings: 'الإعدادات',
    share: 'مشاركة',
    close: 'إغلاق',
    save: 'حفظ',
    cancel: 'إلغاء',
  },

  settings: {
    prayer: {
      title: 'إعدادات الصلاة',
      subtitle: 'الموقع والإشعارات وطريقة الحساب',
    },
  },

  prayerPage: {
    title: 'مواقيت الصلاة',
    subtitle: 'حسب موقعك الحالي',
    adhanSound: 'صوت الأذان',
    weekTimes: 'مواقيت الأسبوع',
    calendarLabel: 'التقويم الهجري',
  },

  prayers: {
    fajr: 'الفجر',
    sunrise: 'الشروق',
    dhuhr: 'الظهر',
    asr: 'العصر',
    maghrib: 'المغرب',
    isha: 'العشاء',
  },

  morePage: {
    title: 'المزيد',
    subtitle: 'تعلّم وأدوات ومعلومات التطبيق',
    tools: 'أدوات',
    learn: 'تعلّم',
    appSettings: 'إعدادات التطبيق',
    support: 'المساعدة والدعم',
    about: 'حول التطبيق',
    quran: 'القرآن الكريم',
    hadith: 'الحديث النبوي',
    sahihayn: 'الصحيحان (البخاري ومسلم)',
    seerah: 'السيرة النبوية',
    prophets: 'قصص الأنبياء',
    sunan: 'السنن المستحبة',
    guide: 'الدليل',
    calendar: 'التقويم',
    ibadati: 'عباداتي',
    search: 'البحث',
    reminders: 'الصلاة على النبي ﷺ',
    prayerSettings: 'الإعدادات',
    rate: 'قيّم التطبيق',
    share: 'شارك التطبيق',
    qr: 'رمز الـ QR',
    exit: 'خروج',
    supportTile: 'الدعم والتواصل',
    aboutApp: 'عن التطبيق',
    privacy: 'سياسة الخصوصية',
    disclaimer: 'إخلاء المسؤولية',
  },

  morePageExtra: {
    copied: 'تم النسخ',
    copyLink: 'نسخ الرابط',
  },

  quranPage: {
    title: 'القرآن الكريم',
    subtitle: 'بالرسم العثماني مع تلاوات أشهر القراء',
    dailyWird: 'الورد اليومي',
    dailyWirdDesc: 'خطة لختم القرآن',
    reciters: 'القراء والتلاوات',
    recitersDesc: 'أكثر من ٢٠٠ قارئ',
    surahIndex: 'فهرس السور',
  },

  adhkarPage: {
    title: 'الأذكار والأدعية',
    subtitle: 'حصنك اليومي من القرآن والسنة',
    tasbih: 'المسبحة الإلكترونية',
    tasbihDesc: 'سبّح واحفظ أذكارك مع الانتقال التلقائي',
    hisn: 'حصن المسلم كاملاً',
    ruqyah: 'الرقية الشرعية',
    daily: 'الأذكار اليومية',
    situations: 'أذكار الأحوال والمناسبات',
    dua: 'الأدعية والتسبيح',
    asmaulHusna: 'أسماء الله الحسنى',
    asmaulHusnaDesc: 'للتفكر والتدبر في معاني أسماء الله',
    footer:
      'الأذكار مأخوذة من القرآن الكريم وكتاب حصن المسلم وكتب السنة، مع الاقتصار على ما صح أو حسن إسناده بحسب تخريج أهل العلم.',
    dhikrCount: 'ذكراً',
    babCount: 'باباً',
  },

  dhikrList: {
    completed: 'أنجزت',
    of: 'من',
    reset: 'إعادة',
    done: 'تم بحمد الله',
    goal: 'الهدف',
    time: 'مرة',
    nextIn: 'الانتقال إلى',
    after: 'بعد',
    seconds: 'ثوانٍ',
    goNow: 'الانتقال الآن',
    stayHere: 'البقاء هنا',
    lastSection: 'هذا آخر قسم من الأذكار والأدعية',
    shareDhikr: 'مشاركة الذكر',
  },

  surahList: {
    surah: 'سُورَةُ',
    ayahs: 'آية',
    meccan: 'مكية',
    medinan: 'مدنية',
  },

  qiblaPage: {
    title: 'اتجاه القبلة',
    subtitle: 'بوصلة دقيقة حسب موقعك',
    verse:
      'قَدْ نَرَىٰ تَقَلُّبَ وَجْهِكَ فِي السَّمَاءِ ۖ فَلَنُوَلِّيَنَّكَ قِبْلَةً تَرْضَاهَا ۚ فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ',
    verseSource: 'سورة البقرة - الآية ١٤٤',
    north: 'ش',
    east: 'شر',
    south: 'ج',
    west: 'غ',
    kaaba: 'الكعبة',
    qiblaDir: 'اتجاه القبلة',
    fromNorth: 'من الشمال',
    distanceToMakkah: 'المسافة إلى مكة',
    km: 'كيلومتر',
    facingQibla: 'أنت متجه نحو القبلة',
    startCompass: 'تشغيل البوصلة',
    calibrate: 'حرّك هاتفك على شكل رقم ٨ لمعايرة البوصلة...',
    sensorError:
      'جهازك لا يدعم مستشعر البوصلة. استخدم اتجاه القبلة بالدرجات أدناه.',
    permissionError: 'لم يتم السماح بالوصول إلى مستشعر الاتجاه.',
    instructions:
      'ضع الهاتف بشكل أفقي بعيداً عن المعادن والأجهزة الكهربائية للحصول على دقة أعلى.',
  },

  kidsPage: {
    title: 'ركن الأطفال',
    subtitle: 'نتعلم ديننا بحب ومتعة',
    shortSurahs: '📖 احفظ قصار السور',
    quiz: '🏆 اختبر معلوماتك',
    duas: '🤲 أدعية صغيرة أحفظها',
    letters: '🔤 الحروف العربية',
    lessons: '📚 دروس مصورة',
    wellDone: 'أحسنت! نتيجتك',
    of: 'من',
    playAgain: 'العب مرة أخرى',
    question: 'سؤال',
    options: 'الخيارات',
    source: 'المصدر',
  },

  weekPrayerTimes: {
    today: 'اليوم',
    days: {
      '0': 'الأحد',
      '1': 'الإثنين',
      '2': 'الثلاثاء',
      '3': 'الأربعاء',
      '4': 'الخميس',
      '5': 'الجمعة',
      '6': 'السبت',
    },
    months: {
      '0': 'يناير',
      '1': 'فبراير',
      '2': 'مارس',
      '3': 'أبريل',
      '4': 'مايو',
      '5': 'يونيو',
      '6': 'يوليو',
      '7': 'أغسطس',
      '8': 'سبتمبر',
      '9': 'أكتوبر',
      '10': 'نوفمبر',
      '11': 'ديسمبر',
    },
  },

  locationBanner: {
    notDetermined: 'لم يتم تحديد موقعك',
    message: 'المواقيت المعروضة الآن لمدينة',
    messageEnd: '. فعّل إذن الموقع أو اختر مدينتك يدوياً.',
    openSettings: 'فتح إعدادات الموقع',
  },

  ibadatiCard: {
    title: 'عباداتي',
    dailyTracking: 'متابعة يومية',
    todayProgress: 'إنجاز اليوم',
  },

  notificationPrompt: {
    title: 'تفعيل إشعارات الأذان',
    desc: 'للتنبيه بمواعيد الصلاة والأذان في وقتها',
    enable: 'تفعيل الإشعارات',
    successTitle: 'تم تفعيل الإشعارات',
    successBody: 'ستصلك تنبيهات الصلاة والأذان في وقتها',
  },

  adhanSettingsPage: {
    title: 'صوت الأذان',
    subtitle: 'اختر الصوت المفضل لديك',
  },

  adhanSettings: {
    batteryTitle: 'تفعيل العمل في الخلفية',
    batteryDesc:
      'لكي يعمل الأذان في وقته تماماً ولا يتوقف عند إغلاق الشاشة، يرجى السماح للتطبيق بالعمل في الخلفية (تجاهل تحسين البطارية).',
    batteryButton: 'السماح بالعمل في الخلفية',
    perPrayerTitle: 'أذان كل صلاة',
    perPrayerDesc:
      'اختر لكل صلاة الأذان الذي تريده. الصلاة التي لم تختر لها شيئاً تأخذ الصوت الافتراضي.',
    adhanFor: 'أذان',
    useDefault: 'استخدم الافتراضي',
    play: 'تجربة',
    stop: 'إيقاف',
    defaultVoiceTitle: 'الصوت الافتراضي للصلوات التي لم تختر لها',
    defaultVoiceSelect: 'اختر الصوت الافتراضي',
  },

  hijriCalendar: {
    prevMonth: 'الشهر السابق',
    nextMonth: 'الشهر التالي',
    monthOccasions: 'مناسبات هذا الشهر',
    noOccasions:
      'لا توجد مناسبات بارزة هذا الشهر. يُستحب صيام الأيام البيض (١٣، ١٤، ١٥ من كل شهر هجري).',
    calendarNote:
      'يعتمد التقويم على حساب أم القرى، وقد يختلف يوماً حسب رؤية الهلال في بلدك. يمكنك تعديل التاريخ من إعدادات مواقيت الصلاة.',
    weekdays: {
      '0': 'أحد',
      '1': 'إثنين',
      '2': 'ثلاثاء',
      '3': 'أربعاء',
      '4': 'خميس',
      '5': 'جمعة',
      '6': 'سبت',
    },
  },

  ibadatiPage: {
    title: 'عباداتي',
    subtitle: 'متابعة يومية لأعمالك، تبدأ من جديد كل يوم',
    todayProgress: 'إنجاز اليوم',
    of: 'من',
    saveNotice: 'تُحفظ على جهازك فقط، وتبدأ القائمة من جديد كل يوم.',
    groups: {
      prayer: 'الصلوات',
      dhikr: 'الأذكار',
      quran: 'القرآن',
    },
    dailyChallenge: 'تحدي اليوم',
    items: {
      fajr: 'صلاة الفجر',
      dhuhr: 'صلاة الظهر',
      asr: 'صلاة العصر',
      maghrib: 'صلاة المغرب',
      isha: 'صلاة العشاء',
      morning: 'أذكار الصباح',
      evening: 'أذكار المساء',
      sleep: 'أذكار النوم',
      quran: 'ورد من القرآن',
    },
    challenges: [
      'اقرأ صفحة من القرآن الكريم بتدبّر',
      'استغفر الله مئة مرة',
      'تصدّق ولو بشيء قليل',
      'صل صلة رحم بمكالمة أو زيارة',
      'ابتسم في وجه أخيك، فهي صدقة',
      'أكثر من الصلاة على النبي ﷺ اليوم',
      'ساعد أحداً من أهل بيتك دون أن يطلب',
      'اقرأ حديثاً من الأحاديث المختارة في التطبيق',
    ],
  },

  legal: {
    privacy: {
      title: 'سياسة الخصوصية',
      updated: 'أكتوبر 2026',
    },
    disclaimer: {
      title: 'إخلاء المسؤولية',
      updated: 'أكتوبر 2026',
    },
  },

  supportPage: {
    title: 'الدعم والتواصل',
    intro:
      'نسعد بتواصلك معنا! إذا واجهت أي مشكلة في التطبيق، أو كان لديك اقتراح أو ملاحظة، فلا تتردد في مراسلتنا عبر البريد. نقرأ كل الرسائل ونعمل على التحسين باستمرار.',
    emailTitle: 'البريد الإلكتروني',
    howCanWeHelp: 'كيف يمكننا مساعدتك؟',
    helpItems: [
      'الإبلاغ عن مشكلة أو خطأ في التطبيق.',
      'اقتراح ميزة جديدة أو تحسين.',
      'ملاحظة على محتوى (نص، صوت، ترجمة).',
      'طلب يتعلق بحقوق الملكية أو المحتوى.',
    ],
    responseTimeTitle: '⏱️ وقت الرد',
    responseTimeDesc:
      'نسعى للرد على جميع الرسائل خلال 24 إلى 48 ساعة بإذن الله.',
    footer: 'جزاكم الله خيراً على استخدامكم التطبيق 🤲',
  },

  remindersPage: {
    title: 'الصلاة على النبي ﷺ',
    subtitle: 'اجعل يومك مليئاً بالذكر والصلاة على الحبيب',
    exactAlarmTitle: 'التذكيرات لن تعمل بدقة!',
    exactAlarmDesc:
      'نظام الهاتف يمنع التطبيق من ضبط المنبهات الدقيقة. يرجى الضغط على الزر أدناه والسماح بذلك لضمان عمل التذكير.',
    exactAlarmButton: 'السماح بالمنبهات الدقيقة',
    salawatTitle: 'الصلاة على النبي ﷺ',
    salawatDesc: 'تذكير بالصلاة على الحبيب',
    reminderEvery: 'التذكير كل:',
    customize: 'تخصيص',
    back: 'رجوع',
    save: 'حفظ',
    saving: 'جاري الحفظ...',
    tone: 'نغمة التذكير:',
    adhkarTitle: 'تذكير الأذكار والقرآن',
    adhkarDesc: 'إشعارات لطيفة تسألك: هل قرأت وردك؟',
    intervals: {
      '30min': '30 دقيقة',
      '1h': 'ساعة',
      '2h': 'ساعتان',
      '3h': '3 ساعات',
      '6h': '6 ساعات',
      '12h': '12 ساعة',
      min: 'دقيقة',
      hr: 'ساعة',
      count: 'العدد',
    },
    sounds: {
      '1': 'الصوت الأول (الافتراضي)',
      '2': 'الصوت الثاني',
      '3': 'الصوت الثالث',
    },
    errors: {
      invalidMinutes: 'الرجاء إدخال وقت صحيح (دقيقة واحدة على الأقل).',
      invalidNumber: 'الرجاء إدخال رقم صحيح',
      audioNotFound: 'لم يتم العثور على الملف الصوتي.',
      scheduleError:
        'حدث خطأ! يرجى التأكد من إعطاء صلاحية "المنبهات" للتطبيق.',
    },
  },

  themeToggle: {
    lightMode: 'الوضع الفاتح',
    darkMode: 'الوضع الداكن',
    switchTheme: 'تبديل مظهر التطبيق',
  },

  dailyMessageToggle: {
    title: 'دعاء اليوم',
    active: 'يظهر مرة يومياً',
    inactive: 'متوقف',
  },

  searchPage: {
    title: 'البحث',
    subtitle: 'في الأذكار والأنبياء والأحاديث والغزوات والسنن',
    placeholder: 'ابحث عن ذكر، نبي، حديث، غزوة، سنة...',
    srLabel: 'ابحث في محتوى التطبيق',
    noResults: 'لا توجد نتائج. جرّب كلمة أخرى.',
  },

  hadithPage: {
    title: 'الحديث النبوي',
    subtitle: 'من جوامع كلم النبي صلى الله عليه وسلم',
    searchPlaceholder: 'ابحث في نص الحديث، أو الشرح...',
    all: 'الكل',
    noResults: 'لا توجد أحاديث مطابقة لبحثك.',
    source: 'المصدر:',
    explanation: 'الشرح والفوائد:',
    closeHint: 'اضغط في أي مكان خارج النافذة للإغلاق',
  },

  ghazawatPage: {
    title: 'غزوات النبي ﷺ',
    subtitle: 'أبرز الغزوات مرتبة زمنياً',
    lesson: 'العبرة:',
    footer:
      'التواريخ والأحداث وفق المشهور في كتب السيرة، وتختلف بعض الروايات في التفاصيل. للاستزادة يُرجع إلى كتب السيرة المعتمدة.',
  },

  asmaulHusnaPage: {
    title: 'أسماء الله الحسنى',
    subtitle: 'للتفكر والتدبر في معاني أسماء الله',
    closeHint: 'اضغط في أي مكان للإغلاق',
  },

  hisnPage: {
    title: 'حصن المسلم',
    babCount: 'باباً',
    dhikrCount: 'ذكراً',
    footer:
      'النصوص من كتاب «حصن المسلم من أذكار الكتاب والسنة» لسعيد بن علي بن وهف القحطاني. لم يُضَف تخريج الأحاديث في هذا القسم، فيُنصح بمراجعة الأذكار مع أهل العلم. تفاصيل المصدر في «المزيد» ← «حول التطبيق».',
  },

  prophetsPage: {
    title: 'قصص الأنبياء',
    subtitle: 'نبذة مختصرة عن الأنبياء الـ{count} المذكورين في القرآن الكريم',
    peaceBeUponHim: 'عليه السلام',
    footer:
      'نبذ مختصرة مأخوذة من القرآن الكريم وكتب التفسير وقصص الأنبياء.',
  },

  sunanPage: {
    title: 'السنن المستحبة في اليوم والليلة',
    subtitle: 'السنن الرواتب وأهم السنن المهجورة',
    rawatibTitle: '🕌 السنن الرواتب ({count} ركعة)',
    rakaat: 'ركعات',
    sunnahOf: 'سنة',
    forgottenTitle: '🌱 أهم السنن المهجورة',
    forgottenDesc:
      'سنن ثابتة قلّ من يعمل بها، فأحيِها تُؤجر على إحيائها. اضغط على السنة لقراءة دليلها.',
    source: 'المصدر:',
    footer:
      'النصوص منقولة مع تخريجها كما وردت في مصادرها. وللاستزادة أو التثبت من درجة الحديث يُرجع إلى أهل العلم.',
  },

  guidePage: {
    title: 'دليل المسلم',
    subtitle: 'الوضوء، الصلاة، الطهارة، الصيام، الزكاة وأحكام أخرى',
  },

  prayerSettingsPage: {
    location: 'الموقع',
    currentCity: 'المدينة الحالية',
    detectLocation: 'تحديد موقعي تلقائياً',
    detecting: 'جارٍ التحديد...',
    manualSelect: 'اختيار يدوي',
    searchCityPlaceholder: 'ابحث عن مدينتك...',
    calcMethod: 'طريقة الحساب',
    asrMadhab: 'مذهب حساب العصر',
    shafiMalikiHanbali: 'شافعي / مالكي / حنبلي',
    hanafi: 'حنفي',
    adhanActivation: 'تفعيل الأذان',
    adhanSelectPrayers: 'اختر الصلوات التي تريد سماع الأذان لها',
    notifications: 'الإشعارات',
    persistentNotification: 'إشعار دائم بالصلاة القادمة',
    persistentNotificationDesc: 'يبقى ظاهراً في الخلفية ويعرض الوقت المتبقي',
    vibration: 'الاهتزاز',
    vibrationDesc: 'اهتزاز عند تفاعل التطبيق وعند الإشعارات',
    overlayPermission: 'الظهور فوق التطبيقات',
    overlayPermissionDesc:
      'ضروري لضمان عمل الأذان حتى لو أُغلق التطبيق',
    enable: 'تفعيل',
    appLanguage: 'لغة التطبيق / App Language',
    appLanguageDesc: 'تغيير لغة الواجهة بالكامل',
    preAdhanTitle: 'تنبيه قبل الأذان',
    preAdhanEnable: 'تفعيل التنبيه قبل الأذان',
    preAdhanEnableDesc:
      'إشعار قبل وقت الأذان، دون التأثير على الأذان أو عدّاد الوقت.',
    preAdhanMinutesTitle: 'اختر مدة التنبيه قبل الأذان',
    preAdhanMinutes: {
      '5': '5 دقائق',
      '10': '10 دقائق',
      '15': '15 دقيقة',
      '30': '30 دقيقة',
    },
    methods: {
      UmmAlQura: 'أم القرى (السعودية)',
      Egyptian: 'الهيئة المصرية',
      MuslimWorldLeague: 'رابطة العالم الإسلامي',
      JordanAwqaf: 'الأردن - وزارة الأوقاف',
      AlgeriaMinistry: 'الجزائر - وزارة الشؤون الدينية',
      TunisiaMinistry: 'تونس - وزارة الشؤون الدينية',
      MoroccoHabous: 'المغرب - وزارة الأوقاف',
      Karachi: 'كراتشي (باكستان)',
      Dubai: 'دبي',
      Kuwait: 'الكويت',
      Qatar: 'قطر',
      Turkey: 'تركيا',
      NorthAmerica: 'أمريكا الشمالية',
      Singapore: 'سنغافورة',
      MoonsightingCommittee: 'لجنة رؤية الهلال',
    },
    alerts: {
      locationDenied:
        '⚠️ لم يُسمح للتطبيق بالوصول إلى الموقع\n\nلتفعيله:\n١. إعدادات الهاتف ← التطبيقات ← إسلامي\n٢. الأذونات ← الموقع\n٣. اختر «السماح أثناء استخدام التطبيق»\n٤. ارجع واضغط «تحديد موقعي تلقائياً»',
      locationDeniedWeb:
        '⚠️ تم رفض الوصول للموقع\n\nلتفعيله:\n• اضغط على 🔒 بجانب الرابط\n• Site settings → Location → Allow',
      locationError:
        '⚠️ تعذّر تحديد موقعك. تأكد من تشغيل خدمة الموقع (GPS) ثم أعد المحاولة.',
      notificationError: 'حدث خطأ في الاتصال بنظام الإشعارات.',
      overlayManual:
        'يرجى تفعيل الصلاحية يدوياً من: الإعدادات > التطبيقات > إسلامي > الظهور فوق التطبيقات',
    },
  },

  quranComponents: {
    bookmarks: {
      continueReading: 'متابعة القراءة',
      surahLabel: 'سورة',
      pageLabel: 'صفحة',
      bookmarksTitle: 'العلامات المرجعية',
      deleteAria: 'حذف العلامة',
    },
    lastPlayed: {
      continueListening: 'أكمل الاستماع من حيث توقفت',
      hideAria: 'إخفاء',
      surahPrefix: 'سورة',
    },
    khatmah: {
      title: 'ختمة القرآن',
      startJourney: 'ابدأ رحلتك مع القرآن اليوم',
      youAreAtPage: 'أنت في الصفحة {page}',
      completedKhatmah: 'ما شاء الله! أتممت الختمة',
      pagesRemaining: 'متبقي {count} صفحة',
      duaTitle: 'دعاء ختم القرآن',
      duaSubtitle: 'نسأل الله أن يجعله في ميزان حسناتك',
    },
    khatmahDuaPage: {
      title: 'دعاء ختم القرآن الكريم',
      subtitle: 'نسأل الله أن يجعله في ميزان حسناتك',
      footer: 'تقبل الله منا ومنكم صالح الأعمال',
    },
    recitersBrowser: {
      searchPlaceholder: 'ابحث باسم القارئ...',
      noResults: 'لا توجد نتائج مطابقة لبحثك.',
      defaultReciter: 'قارئ',
      moshafMurattal: 'مصحف مرتل',
    },
  },

  sahihaynPage: {
    title: 'الصحيحان',
    subtitle: 'صحيح البخاري وصحيح مسلم',
    bukhari: 'صحيح البخاري',
    muslim: 'صحيح مسلم',
    chapters: 'الكتب والأبواب',
    searchPlaceholder: 'ابحث في الأحاديث...',
    noResults: 'لا توجد نتائج مطابقة لبحثك.',
    source: 'المصدر:',
    sourceValue: 'Sunnah.com (ترتيب وتبويب)',
    disclaimer:
      'المصدر: موقع Sunnah.com. حقوق الترتيب والتبويب محفوظة لهم. النصوص منقولة لغرض تعليمي، ويُرجع للمصادر المطبوعة الرسمية عند التحقق.',
    hadithNumber: 'حديث رقم',
    narrator: 'الراوي:',
  },
}

const ENGLISH_DICTIONARY: Dictionary = {
  nav: {
    more: 'More',
    qibla: 'Qibla',
    kids: 'Kids',
    adhkar: 'Adhkar',
    quran: 'Quran',
    prayer: 'Prayer',
  },

  common: {
    settings: 'Settings',
    share: 'Share',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
  },

  settings: {
    prayer: {
      title: 'Prayer Settings',
      subtitle: 'Location, notifications, and calculation method',
    },
  },

  prayerPage: {
    title: 'Prayer Times',
    subtitle: 'Based on your current location',
    adhanSound: 'Adhan Sound',
    weekTimes: 'Week Times',
    calendarLabel: 'Hijri Calendar',
  },

  prayers: {
    fajr: 'Fajr',
    sunrise: 'Sunrise',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
  },

  morePage: {
    title: 'More',
    subtitle: 'Learn, tools, and app information',
    tools: 'Tools',
    learn: 'Learn',
    appSettings: 'App Settings',
    support: 'Help & Support',
    about: 'About App',
    quran: 'Holy Quran',
    hadith: "Prophet's Hadith",
    sahihayn: 'The Two Sahihs (Bukhari & Muslim)',
    seerah: 'Prophetic Biography',
    prophets: 'Stories of Prophets',
    sunan: 'Recommended Sunnah',
    guide: 'Guide',
    calendar: 'Calendar',
    ibadati: 'My Worship',
    search: 'Search',
    reminders: 'Salawat on Prophet ﷺ',
    prayerSettings: 'Settings',
    rate: 'Rate App',
    share: 'Share App',
    qr: 'QR Code',
    exit: 'Exit',
    supportTile: 'Support & Contact',
    aboutApp: 'About App',
    privacy: 'Privacy Policy',
    disclaimer: 'Disclaimer',
  },

  morePageExtra: {
    copied: 'Copied!',
    copyLink: 'Copy Link',
  },

  quranPage: {
    title: 'Holy Quran',
    subtitle: 'Uthmani script with recitations of famous reciters',
    dailyWird: 'Daily Wird',
    dailyWirdDesc: 'Plan to finish the Quran',
    reciters: 'Reciters & Recitations',
    recitersDesc: 'More than 200 reciters',
    surahIndex: 'Surah Index',
  },

  adhkarPage: {
    title: 'Adhkar & Duas',
    subtitle: 'Your daily fortress from Quran and Sunnah',
    tasbih: 'Electronic Tasbih',
    tasbihDesc: 'Glorify and keep your adhkar with auto-transition',
    hisn: 'Hisn Al-Muslim (Full)',
    ruqyah: 'Ruqyah (Healing)',
    daily: 'Daily Adhkar',
    situations: 'Situations & Occasions',
    dua: 'Duas & Glorification',
    asmaulHusna: 'Names of Allah',
    asmaulHusnaDesc: "Reflect on the meanings of Allah's names",
    footer:
      'Adhkar are taken from the Holy Quran, Hisn Al-Muslim, and Sunnah books, limiting to what is authentic or good according to scholars.',
    dhikrCount: 'Dhikr',
    babCount: 'Chapters',
  },

  dhikrList: {
    completed: 'Completed',
    of: 'of',
    reset: 'Reset',
    done: 'Done',
    goal: 'Goal',
    time: 'times',
    nextIn: 'Moving to',
    after: 'in',
    seconds: 'seconds',
    goNow: 'Go Now',
    stayHere: 'Stay Here',
    lastSection: 'This is the last section of Adhkar',
    shareDhikr: 'Share Dhikr',
  },

  surahList: {
    surah: 'Surah',
    ayahs: 'Ayahs',
    meccan: 'Meccan',
    medinan: 'Medinan',
  },

  qiblaPage: {
    title: 'Qibla Direction',
    subtitle: 'Accurate compass based on your location',
    verse:
      'We have certainly seen the turning of your face, [O Muhammad], toward the heaven, and We will surely turn you to a qiblah with which you will be pleased. So turn your face toward al-Masjid al-Haram.',
    verseSource: 'Surah Al-Baqarah - Ayah 144',
    north: 'N',
    east: 'E',
    south: 'S',
    west: 'W',
    kaaba: 'Kaaba',
    qiblaDir: 'Qibla Direction',
    fromNorth: 'from North',
    distanceToMakkah: 'Distance to Makkah',
    km: 'km',
    facingQibla: 'You are facing the Qibla',
    startCompass: 'Start Compass',
    calibrate: 'Move your phone in a figure 8 to calibrate the compass...',
    sensorError:
      'Your device does not support a compass sensor. Use the degree direction below.',
    permissionError:
      'Permission to access the orientation sensor was denied.',
    instructions:
      'Place the phone horizontally away from metals and electronics for higher accuracy.',
  },

  kidsPage: {
    title: 'Kids Corner',
    subtitle: 'Learn our religion with love and fun',
    shortSurahs: '📖 Memorize Short Surahs',
    quiz: '🏆 Test Your Knowledge',
    duas: '🤲 Small Duas I Memorize',
    letters: '🔤 Arabic Letters',
    lessons: '📚 Illustrated Lessons',
    wellDone: 'Well done! Your score',
    of: 'of',
    playAgain: 'Play Again',
    question: 'Question',
    options: 'Options',
    source: 'Source',
  },

  weekPrayerTimes: {
    today: 'Today',
    days: {
      '0': 'Sunday',
      '1': 'Monday',
      '2': 'Tuesday',
      '3': 'Wednesday',
      '4': 'Thursday',
      '5': 'Friday',
      '6': 'Saturday',
    },
    months: {
      '0': 'January',
      '1': 'February',
      '2': 'March',
      '3': 'April',
      '4': 'May',
      '5': 'June',
      '6': 'July',
      '7': 'August',
      '8': 'September',
      '9': 'October',
      '10': 'November',
      '11': 'December',
    },
  },

  locationBanner: {
    notDetermined: 'Location not determined',
    message: 'The times shown are for',
    messageEnd:
      '. Please enable location permission or select your city manually.',
    openSettings: 'Open Location Settings',
  },

  ibadatiCard: {
    title: 'My Worship',
    dailyTracking: 'Daily Tracking',
    todayProgress: "Today's Progress",
  },

  notificationPrompt: {
    title: 'Enable Adhan Notifications',
    desc: 'To alert you of prayer times and Adhan on time',
    enable: 'Enable Notifications',
    successTitle: 'Notifications Enabled',
    successBody: 'You will receive prayer and Adhan alerts on time',
  },

  adhanSettingsPage: {
    title: 'Adhan Sound',
    subtitle: 'Choose your preferred sound',
  },

  adhanSettings: {
    batteryTitle: 'Enable Background Work',
    batteryDesc:
      'To ensure the Adhan plays exactly on time and doesn’t stop when the screen is off, please allow the app to run in the background (ignore battery optimization).',
    batteryButton: 'Allow Background Work',
    perPrayerTitle: 'Adhan for each prayer',
    perPrayerDesc:
      'Choose the Adhan you want for each prayer. Prayers without a specific choice will use the default voice.',
    adhanFor: 'Adhan for',
    useDefault: 'Use Default',
    play: 'Preview',
    stop: 'Stop',
    defaultVoiceTitle:
      'Default voice for prayers without a specific choice',
    defaultVoiceSelect: 'Select Default Voice',
  },

  hijriCalendar: {
    prevMonth: 'Previous Month',
    nextMonth: 'Next Month',
    monthOccasions: 'Occasions this month',
    noOccasions:
      'No major occasions this month. It is recommended to fast the White Days (13th, 14th, 15th of each Hijri month).',
    calendarNote:
      'The calendar is based on Umm Al-Qura calculation and may vary by a day depending on moon sighting in your country. You can adjust the date from prayer settings.',
    weekdays: {
      '0': 'Sun',
      '1': 'Mon',
      '2': 'Tue',
      '3': 'Wed',
      '4': 'Thu',
      '5': 'Fri',
      '6': 'Sat',
    },
  },

  ibadatiPage: {
    title: 'My Worship',
    subtitle: 'Daily tracking of your deeds, starts fresh every day',
    todayProgress: "Today's Progress",
    of: 'of',
    saveNotice:
      'Saved on your device only, and the list resets every day.',
    groups: {
      prayer: 'Prayers',
      dhikr: 'Adhkar',
      quran: 'Quran',
    },
    dailyChallenge: 'Daily Challenge',
    items: {
      fajr: 'Fajr Prayer',
      dhuhr: 'Dhuhr Prayer',
      asr: 'Asr Prayer',
      maghrib: 'Maghrib Prayer',
      isha: 'Isha Prayer',
      morning: 'Morning Adhkar',
      evening: 'Evening Adhkar',
      sleep: 'Sleep Adhkar',
      quran: 'Quran Wird',
    },
    challenges: [
      'Read a page of the Quran with reflection',
      "Seek Allah's forgiveness 100 times",
      'Give charity, even if small',
      'Maintain family ties with a call or visit',
      'Smile in the face of your brother, it is charity',
      'Increase Salawat on the Prophet ﷺ today',
      'Help a family member without being asked',
      'Read a hadith from the selected hadiths in the app',
    ],
  },

  legal: {
    privacy: {
      title: 'Privacy Policy',
      updated: 'October 2026',
    },
    disclaimer: {
      title: 'Disclaimer',
      updated: 'October 2026',
    },
  },

  supportPage: {
    title: 'Support & Contact',
    intro:
      "We are happy to hear from you! If you face any issue with the app, or have a suggestion or feedback, please don't hesitate to email us. We read every message and continuously work on improvements.",
    emailTitle: 'Email',
    howCanWeHelp: 'How can we help you?',
    helpItems: [
      'Report a problem or bug in the app.',
      'Suggest a new feature or improvement.',
      'Feedback on content (text, audio, translation).',
      'Request related to copyright or content.',
    ],
    responseTimeTitle: '⏱️ Response Time',
    responseTimeDesc:
      "We strive to respond to all messages within 24 to 48 hours, by Allah's permission.",
    footer: 'May Allah reward you for using the app 🤲',
  },

  remindersPage: {
    title: 'Salawat on Prophet ﷺ',
    subtitle:
      'Make your day full of remembrance and Salawat on the Beloved',
    exactAlarmTitle: "Reminders won't work accurately!",
    exactAlarmDesc:
      'The phone system prevents the app from setting exact alarms. Please tap the button below and allow it to ensure reminders work.',
    exactAlarmButton: 'Allow Exact Alarms',
    salawatTitle: 'Salawat on Prophet ﷺ',
    salawatDesc: 'Reminder to send Salawat on the Beloved',
    reminderEvery: 'Remind every:',
    customize: 'Customize',
    back: 'Back',
    save: 'Save',
    saving: 'Saving...',
    tone: 'Reminder tone:',
    adhkarTitle: 'Adhkar & Quran Reminder',
    adhkarDesc: 'Gentle notifications asking: Did you read your wird?',
    intervals: {
      '30min': '30 min',
      '1h': '1 hour',
      '2h': '2 hours',
      '3h': '3 hours',
      '6h': '6 hours',
      '12h': '12 hours',
      min: 'min',
      hr: 'hr',
      count: 'Count',
    },
    sounds: {
      '1': 'First sound (default)',
      '2': 'Second sound',
      '3': 'Third sound',
    },
    errors: {
      invalidMinutes:
        'Please enter a valid time (at least 1 minute).',
      invalidNumber: 'Please enter a valid number',
      audioNotFound: 'Audio file not found.',
      scheduleError:
        'An error occurred! Please ensure the "Alarms" permission is granted to the app.',
    },
  },

  themeToggle: {
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    switchTheme: 'Switch app theme',
  },

  dailyMessageToggle: {
    title: 'Daily Dua',
    active: 'Shows once daily',
    inactive: 'Disabled',
  },

  searchPage: {
    title: 'Search',
    subtitle:
      'In adhkar, prophets, hadiths, battles, and sunnahs',
    placeholder:
      'Search for a dhikr, prophet, hadith, battle, sunnah...',
    srLabel: 'Search app content',
    noResults: 'No results found. Try another word.',
  },

  hadithPage: {
    title: "Prophet's Hadith",
    subtitle:
      'From the comprehensive words of the Prophet (PBUH)',
    searchPlaceholder:
      'Search in hadith text or explanation...',
    all: 'All',
    noResults: 'No hadiths match your search.',
    source: 'Source:',
    explanation: 'Explanation & Benefits:',
    closeHint: 'Tap anywhere outside the window to close',
  },

  ghazawatPage: {
    title: "Prophet's Battles ﷺ",
    subtitle:
      'Most prominent battles arranged chronologically',
    lesson: 'Lesson:',
    footer:
      'Dates and events according to what is famous in Seerah books, and some narrations differ in details. For more, refer to approved Seerah books.',
  },

  asmaulHusnaPage: {
    title: 'Names of Allah',
    subtitle: "Reflect on the meanings of Allah's names",
    closeHint: 'Tap anywhere to close',
  },

  hisnPage: {
    title: 'Hisn Al-Muslim',
    babCount: 'chapters',
    dhikrCount: 'adhkar',
    footer:
      "Texts from the book 'Hisn Al-Muslim from the Adhkar of the Book and Sunnah' by Saeed bin Ali bin Wahf Al-Qahtani. Hadith takhrij was not added in this section, so reviewing adhkar with scholars is recommended. Source details in 'More' → 'About App'.",
  },

  prophetsPage: {
    title: 'Stories of Prophets',
    subtitle:
      'Brief overview of the {count} prophets mentioned in the Holy Quran',
    peaceBeUponHim: '(PBUH)',
    footer:
      'Brief excerpts taken from the Holy Quran, books of tafsir, and stories of prophets.',
  },

  sunanPage: {
    title: 'Recommended Sunnahs Day and Night',
    subtitle:
      'Regular Sunnahs and the most important forgotten Sunnahs',
    rawatibTitle:
      "🕌 Regular Sunnahs ({count} rak'ahs)",
    rakaat: "rak'ahs",
    sunnahOf: 'Sunnah of',
    forgottenTitle: '🌱 Most Important Forgotten Sunnahs',
    forgottenDesc:
      'Established sunnahs that few practice; revive them and you will be rewarded for reviving them. Tap on a sunnah to read its evidence.',
    source: 'Source:',
    footer:
      'Texts are transmitted with their takhrij as stated in their sources. To learn more or verify the hadith grade, refer to scholars.',
  },

  guidePage: {
    title: "Muslim's Guide",
    subtitle:
      'Wudu, prayer, purification, fasting, zakat, and other rulings',
  },

  prayerSettingsPage: {
    location: 'Location',
    currentCity: 'Current City',
    detectLocation: 'Detect My Location',
    detecting: 'Detecting...',
    manualSelect: 'Manual Select',
    searchCityPlaceholder: 'Search for your city...',
    calcMethod: 'Calculation Method',
    asrMadhab: 'Asr Calculation Madhab',
    shafiMalikiHanbali: "Shafi'i / Maliki / Hanbali",
    hanafi: 'Hanafi',
    adhanActivation: 'Adhan Activation',
    adhanSelectPrayers:
      'Select prayers you want to hear Adhan for',
    notifications: 'Notifications',
    persistentNotification:
      'Persistent notification for next prayer',
    persistentNotificationDesc:
      'Stays visible in background showing remaining time',
    vibration: 'Vibration',
    vibrationDesc:
      'Vibrate on app interaction and notifications',
    overlayPermission: 'Display over other apps',
    overlayPermissionDesc:
      'Required to ensure Adhan works even if app is closed',
    enable: 'Enable',
    appLanguage: 'App Language / لغة التطبيق',
    appLanguageDesc: 'Change the entire interface language',
    preAdhanTitle: 'Pre-Adhan Alert',
    preAdhanEnable: 'Enable pre-adhan alert',
    preAdhanEnableDesc:
      'A notification before the adhan time, without affecting the adhan or countdown.',
    preAdhanMinutesTitle: 'Choose alert time before adhan',
    preAdhanMinutes: {
      '5': '5 min',
      '10': '10 min',
      '15': '15 min',
      '30': '30 min',
    },
    methods: {
      UmmAlQura: 'Umm Al-Qura (Saudi Arabia)',
      Egyptian: 'Egyptian Authority',
      MuslimWorldLeague: 'Muslim World League',
      JordanAwqaf: 'Jordan - Ministry of Awqaf',
      AlgeriaMinistry:
        'Algeria - Ministry of Religious Affairs',
      TunisiaMinistry:
        'Tunisia - Ministry of Religious Affairs',
      MoroccoHabous:
        'Morocco - Ministry of Awqaf',
      Karachi: 'Karachi (Pakistan)',
      Dubai: 'Dubai',
      Kuwait: 'Kuwait',
      Qatar: 'Qatar',
      Turkey: 'Turkey',
      NorthAmerica: 'North America',
      Singapore: 'Singapore',
      MoonsightingCommittee: 'Moonsighting Committee',
    },
    alerts: {
      locationDenied:
        '⚠️ App was not allowed to access location\n\nTo enable:\n1. Phone settings → Apps → Islami\n2. Permissions → Location\n3. Choose \'Allow while using app\'\n4. Return and tap \'Detect My Location\'',
      locationDeniedWeb:
        '⚠️ Location access denied\n\nTo enable:\n• Click 🔒 next to the URL\n• Site settings → Location → Allow',
      locationError:
        '⚠️ Could not detect your location. Make sure GPS is on, then try again.',
      notificationError:
        'Error connecting to notification system.',
      overlayManual:
        'Please enable the permission manually from: Settings > Apps > Islami > Display over other apps',
    },
  },

  quranComponents: {
    bookmarks: {
      continueReading: 'Continue Reading',
      surahLabel: 'Surah',
      pageLabel: 'Page',
      bookmarksTitle: 'Bookmarks',
      deleteAria: 'Delete bookmark',
    },
    lastPlayed: {
      continueListening:
        'Resume listening where you stopped',
      hideAria: 'Hide',
      surahPrefix: 'Surah',
    },
    khatmah: {
      title: 'Khatmah Tracker',
      startJourney: 'Start your Quran journey today',
      youAreAtPage: 'You are on page {page}',
      completedKhatmah:
        'MashaAllah! You completed the Khatmah',
      pagesRemaining: '{count} pages remaining',
      duaTitle: 'Khatmah Completion Dua',
      duaSubtitle:
        'May Allah make it in the scale of your good deeds',
    },
    khatmahDuaPage: {
      title: 'Khatmah Completion Dua',
      subtitle:
        'May Allah make it in the scale of your good deeds',
      footer:
        'May Allah accept from us and from you the good deeds',
    },
    recitersBrowser: {
      searchPlaceholder: 'Search by reciter name...',
      noResults: 'No results match your search.',
      defaultReciter: 'Reciter',
      moshafMurattal: 'Murattal Mushaf',
    },
  },

  sahihaynPage: {
    title: 'The Two Sahihs',
    subtitle: 'Sahih Al-Bukhari and Sahih Muslim',
    bukhari: 'Sahih Al-Bukhari',
    muslim: 'Sahih Muslim',
    chapters: 'Books & Chapters',
    searchPlaceholder: 'Search hadiths...',
    noResults: 'No results match your search.',
    source: 'Source:',
    sourceValue: 'Sunnah.com (arrangement)',
    disclaimer:
      'Source: Sunnah.com. Rights of arrangement reserved for them. Texts are transmitted for educational purposes; refer to official printed sources for verification.',
    hadithNumber: 'Hadith No.',
    narrator: 'Narrator:',
  },
}

const DICTIONARIES: Record<Locale, Dictionary> = {
  ar: ARABIC_DICTIONARY,
  en: ENGLISH_DICTIONARY,
}

const STORAGE_KEY = 'app-locale'

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  dict: Dictionary
}

const LanguageContext =
  createContext<LanguageContextValue | null>(null)

export function LanguageProvider({
  children,
}: {
  children: ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>('ar')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stored = window.localStorage.getItem(STORAGE_KEY)

    if (stored === 'ar' || stored === 'en') {
      setLocaleState(stored)
    }
  }, [])

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextLocale)
    }
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      dict: DICTIONARIES[locale],
    }),
    [locale, setLocale],
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error(
      'useLanguage must be used within a LanguageProvider',
    )
  }

  return context
}