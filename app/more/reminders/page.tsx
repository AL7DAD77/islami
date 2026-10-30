'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/page-header'
import { useSettings, useHydrated } from '@/lib/settings'
import { Heart, BookOpen, Clock, Music, Settings2, Play, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Capacitor, registerPlugin } from '@capacitor/core'

const AdhanScheduler = registerPlugin<any>('AdhanScheduler')
const SystemSettings = registerPlugin<any>('SystemSettings')

// متغيرات للتحكم في صوت التجربة
let previewAudio: HTMLAudioElement | null = null

export default function RemindersPage() {
  const [settings, update] = useSettings()
  const hydrated = useHydrated()
  
  const [isPending, setIsPending] = useState<'salawat' | 'adhkar' | null>(null)
  const [salawatSound, setSalawatSound] = useState('1')
  const [playingSound, setPlayingSound] = useState<string | null>(null)

  // حالات مخصصة للوقت المخصص
  const [showCustomSalawat, setShowCustomSalawat] = useState(false)
  const [customSalawatValue, setCustomSalawatValue] = useState('')
  const [customSalawatUnit, setCustomSalawatUnit] = useState<'min' | 'hr'>('min')

  const [showCustomAdhkar, setShowCustomAdhkar] = useState(false)
  const [customAdhkarValue, setCustomAdhkarValue] = useState('')
  const [customAdhkarUnit, setCustomAdhkarUnit] = useState<'min' | 'hr'>('min')

  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (Capacitor.getPlatform() === 'android') {
          const res = await SystemSettings.getStringPreference({ key: 'salawat_sound_id' })
          if (res && res.value) setSalawatSound(res.value)
        }
        if (![30, 60, 120, 180].includes(settings.salawatInterval)) {
          setShowCustomSalawat(true)
          setCustomSalawatValue(settings.salawatInterval.toString())
        }
        if (![60, 180, 360, 720].includes(settings.adhkarRemindersInterval)) {
          setShowCustomAdhkar(true)
          setCustomAdhkarValue(settings.adhkarRemindersInterval.toString())
        }
      } catch (e) { console.log("خطأ في قراءة الإعدادات", e) }
    }
    if (hydrated) loadSettings()
  }, [hydrated])

  // دالة إيقاف صوت التجربة
  const stopPreview = () => {
    if (previewAudio) {
      previewAudio.pause()
      previewAudio.currentTime = 0
      previewAudio = null
    }
    setPlayingSound(null)
  }

  // دالة تشغيل صوت التجربة
  const togglePreview = (soundId: string) => {
    if (playingSound === soundId) {
      stopPreview()
      return
    }
    stopPreview()

    const fileName = soundId === '1' ? 'salawat_voice.mp3' : `salawat_voice_${soundId}.mp3`
    const audio = new Audio(`/audio/salawat/${fileName}`)
    
    audio.onended = () => stopPreview()
    audio.play().then(() => {
      previewAudio = audio
      setPlayingSound(soundId)
    }).catch(() => {
      alert('لم يتم العثور على الملف الصوتي. تأكد من وجوده في مجلد public/audio/salawat/')
      stopPreview()
    })
  }

  const handleSoundChange = async (val: string) => {
    stopPreview() // إيقاف أي صوت يعمل عند التغيير
    setSalawatSound(val)
    if (Capacitor.getPlatform() === 'android') {
      try { await SystemSettings.setStringPreference({ key: 'salawat_sound_id', value: val }) } catch (e) {}
    }
  }

  const handleReminderToggle = async (type: 'salawat' | 'adhkar', enabled: boolean, minutes: number) => {
    if (minutes < 1) {
      alert('الرجاء إدخال وقت صحيح (دقيقة واحدة على الأقل).')
      return
    }

    if (Capacitor.getPlatform() === 'android') {
      setIsPending(type) 
      try {
        const reminderId = type === 'salawat' ? 777 : 888;
        
        if (enabled) {
          const title = type === 'salawat' ? 'الصلاة على النبي ﷺ' : 'تذكير بوردك';
          const body = type === 'salawat' ? 'صل على الحبيب.. اجعل لسانك رطباً بذكره' : 'هل قرأت وردك من القرآن والأذكار اليوم؟';
          
          await AdhanScheduler.scheduleReminder({
            id: reminderId,
            intervalMillis: minutes * 60 * 1000,
            title: title,
            body: body
          });
          
          update(type === 'salawat' ? { salawatEnabled: true, salawatInterval: minutes } : { adhkarRemindersEnabled: true, adhkarRemindersInterval: minutes });
        } else {
          await AdhanScheduler.cancelReminder({ id: reminderId });
          update(type === 'salawat' ? { salawatEnabled: false } : { adhkarRemindersEnabled: false });
        }
      } catch (error) {
        console.error('خطأ في جدولة التذكيرات:', error);
        alert('حدث خطأ في النظام.');
      } finally {
        setIsPending(null) 
      }
    } else {
      update(type === 'salawat' ? { salawatEnabled: enabled, salawatInterval: minutes } : { adhkarRemindersEnabled: enabled, adhkarRemindersInterval: minutes });
    }
  }

  const applyCustomSalawat = () => {
    const val = parseInt(customSalawatValue)
    if (isNaN(val) || val <= 0) return
    const minutes = customSalawatUnit === 'hr' ? val * 60 : val
    handleReminderToggle('salawat', true, minutes)
  }

  const applyCustomAdhkar = () => {
    const val = parseInt(customAdhkarValue)
    if (isNaN(val) || val <= 0) return
    const minutes = customAdhkarUnit === 'hr' ? val * 60 : val
    handleReminderToggle('adhkar', true, minutes)
  }

  if (!hydrated) return null

  return (
    <div className="min-h-dvh bg-[#f7f3ea] pb-24" dir="rtl">
      <div className="container mx-auto px-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 max-w-3xl space-y-6">
        
        <PageHeader 
          title="الصلاة على النبي ﷺ" 
          subtitle="اجعل يومك مليئاً بالذكر والصلاة على الحبيب" 
          backHref="/more" 
        />

        {/* قسم الصلاة على النبي */}
        <section className="rounded-3xl bg-white p-5 shadow-sm border border-[#e8dccb]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                <Heart className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-[#0a1f1a]">الصلاة على النبي ﷺ</h3>
                <p className="text-xs text-muted-foreground">تذكير بالصلاة على الحبيب</p>
              </div>
            </div>
            <button
              type="button"
              disabled={isPending === 'salawat'}
              onClick={() => handleReminderToggle('salawat', !settings.salawatEnabled, settings.salawatInterval)}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                settings.salawatEnabled ? 'bg-emerald-600' : 'bg-zinc-300',
                isPending === 'salawat' && 'opacity-50'
              )}
            >
              <span className={cn('absolute top-0.5 size-5 rounded-full bg-white transition-all', settings.salawatEnabled ? 'right-0.5' : 'right-5.5')} />
            </button>
          </div>

          {settings.salawatEnabled && (
            <div className="mt-4 pt-4 border-t border-[#e8dccb] space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3.5" /> التذكير كل:
                  </p>
                  <button 
                    onClick={() => setShowCustomSalawat(!showCustomSalawat)}
                    className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline"
                  >
                    <Settings2 className="size-3" /> تخصيص
                  </button>
                </div>

                {!showCustomSalawat ? (
                  <div className="flex gap-2">
                    {[30, 60, 120, 180].map((min) => (
                      <button
                        key={min}
                        disabled={isPending === 'salawat'}
                        onClick={() => handleReminderToggle('salawat', true, min)}
                        className={cn(
                          'flex-1 rounded-xl py-2 text-sm font-medium transition',
                          settings.salawatInterval === min ? 'bg-[#0a1f1a] text-white' : 'bg-[#f4ece1] text-[#5a3e1b]',
                          isPending === 'salawat' && 'opacity-50'
                        )}
                      >
                        {min === 60 ? 'ساعة' : min === 120 ? 'ساعتان' : min === 180 ? '3 ساعات' : `${min} دقيقة`}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-[#f4ece1] p-2 rounded-xl">
                    <input
                      type="number"
                      min="1"
                      value={customSalawatValue}
                      onChange={(e) => setCustomSalawatValue(e.target.value)}
                      placeholder="العدد"
                      className="w-20 rounded-lg border border-[#e8dccb] px-2 py-1.5 text-center text-sm"
                    />
                    <select
                      value={customSalawatUnit}
                      onChange={(e) => setCustomSalawatUnit(e.target.value as 'min' | 'hr')}
                      className="rounded-lg border border-[#e8dccb] px-2 py-1.5 text-sm bg-white"
                    >
                      <option value="min">دقيقة</option>
                      <option value="hr">ساعة</option>
                    </select>
                    <button
                      onClick={applyCustomSalawat}
                      disabled={isPending === 'salawat'}
                      className="flex-1 rounded-lg bg-[#0a1f1a] py-1.5 text-sm text-white font-bold"
                    >
                      حفظ التخصيص
                    </button>
                  </div>
                )}
              </div>

              {/* قائمة اختيار الصوت مع زر التجربة */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Music className="size-3.5" /> نغمة التذكير:
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={salawatSound}
                    onChange={(e) => handleSoundChange(e.target.value)}
                    className="flex-1 rounded-xl border border-[#e8dccb] bg-[#f4ece1] px-3 py-2.5 text-sm text-[#0a1f1a]"
                  >
                    <option value="1">الصوت الأول (الافتراضي)</option>
                    <option value="2">الصوت الثاني</option>
                    <option value="3">الصوت الثالث</option>
                  </select>

                  {/* زر التشغيل / الإيقاف */}
                  <button
                    type="button"
                    onClick={() => togglePreview(salawatSound)}
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-xl transition',
                      playingSound === salawatSound
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                    )}
                    aria-label={playingSound === salawatSound ? 'إيقاف' : 'تجربة الصوت'}
                  >
                    {playingSound === salawatSound ? <Square className="size-4" /> : <Play className="size-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* قسم تذكير الأذكار والقرآن */}
        <section className="rounded-3xl bg-white p-5 shadow-sm border border-[#e8dccb]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                <BookOpen className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-[#0a1f1a]">تذكير الأذكار والقرآن</h3>
                <p className="text-xs text-muted-foreground">إشعارات لطيفة تسألك: هل قرأت وردك؟</p>
              </div>
            </div>
            <button
              type="button"
              disabled={isPending === 'adhkar'}
              onClick={() => handleReminderToggle('adhkar', !settings.adhkarRemindersEnabled, settings.adhkarRemindersInterval)}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                settings.adhkarRemindersEnabled ? 'bg-emerald-600' : 'bg-zinc-300',
                isPending === 'adhkar' && 'opacity-50'
              )}
            >
              <span className={cn('absolute top-0.5 size-5 rounded-full bg-white transition-all', settings.adhkarRemindersEnabled ? 'right-0.5' : 'right-5.5')} />
            </button>
          </div>

          {settings.adhkarRemindersEnabled && (
            <div className="mt-4 pt-4 border-t border-[#e8dccb]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3.5" /> التذكير كل:
                </p>
                <button 
                  onClick={() => setShowCustomAdhkar(!showCustomAdhkar)}
                  className="text-xs font-bold text-blue-700 flex items-center gap-1 hover:underline"
                >
                  <Settings2 className="size-3" /> تخصيص
                </button>
              </div>

              {!showCustomAdhkar ? (
                <div className="flex gap-2">
                  {[60, 180, 360, 720].map((min) => (
                    <button
                      key={min}
                      disabled={isPending === 'adhkar'}
                      onClick={() => handleReminderToggle('adhkar', true, min)}
                      className={cn(
                        'flex-1 rounded-xl py-2 text-sm font-medium transition',
                        settings.adhkarRemindersInterval === min ? 'bg-[#0a1f1a] text-white' : 'bg-[#f4ece1] text-[#5a3e1b]',
                        isPending === 'adhkar' && 'opacity-50'
                      )}
                    >
                      {min === 60 ? 'ساعة' : min === 180 ? '3 ساعات' : min === 360 ? '6 ساعات' : '12 ساعة'}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-[#f4ece1] p-2 rounded-xl">
                  <input
                    type="number"
                    min="1"
                    value={customAdhkarValue}
                    onChange={(e) => setCustomAdhkarValue(e.target.value)}
                    placeholder="العدد"
                    className="w-20 rounded-lg border border-[#e8dccb] px-2 py-1.5 text-center text-sm"
                  />
                  <select
                    value={customAdhkarUnit}
                    onChange={(e) => setCustomAdhkarUnit(e.target.value as 'min' | 'hr')}
                    className="rounded-lg border border-[#e8dccb] px-2 py-1.5 text-sm bg-white"
                  >
                    <option value="min">دقيقة</option>
                    <option value="hr">ساعة</option>
                  </select>
                  <button
                    onClick={applyCustomAdhkar}
                    disabled={isPending === 'adhkar'}
                    className="flex-1 rounded-lg bg-[#0a1f1a] py-1.5 text-sm text-white font-bold"
                  >
                    حفظ التخصيص
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="rounded-2xl bg-[#d4af37]/10 p-4 text-center">
          <p className="text-sm text-[#b89965] leading-relaxed">
            قال رسول الله ﷺ: "من صلى عليّ صلاة صلى الله عليه بها عشراً". 
            <br/> اجعل لسانك رطباً بذكر الله.
          </p>
        </div>
      </div>
    </div>
  )
}