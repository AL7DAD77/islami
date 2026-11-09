'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/page-header'
import { useSettings, useHydrated } from '@/lib/settings'
import {
  Heart,
  BookOpen,
  Clock,
  Music,
  Play,
  Square,
  AlertTriangle,
  Bell,
  BellOff,
  Settings2, // ✅ أيقونة التخصيص
  ArrowRight, // ✅ أيقونة الرجوع
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { useLanguage } from '@/lib/language-context'

let AdhanScheduler: any = null
let SystemSettings: any = null

if (typeof window !== 'undefined') {
  try {
    AdhanScheduler = registerPlugin<any>('AdhanScheduler')
    SystemSettings = registerPlugin<any>('SystemSettings')
  } catch {
    AdhanScheduler = null
    SystemSettings = null
  }
}

let previewAudio: HTMLAudioElement | null = null

const REMINDER_ID_SALAWAT = 777
const REMINDER_ID_ADHKAR = 888

const SALAWAT_TITLE = 'تذكير بالصلاة على النبي ﷺ'
const SALAWAT_BODY = 'أكثر من الصلاة على النبي ﷺ في يومك'
const ADHKAR_TITLE = 'تذكير بالأذكار'
const ADHKAR_BODY = 'لا تنسَ أذكار الصباح والمساء'

const INTERVAL_OPTIONS = [
  { label: '1 ساعة', value: 60 },
  { label: '3 ساعات', value: 180 },
  { label: '6 ساعات', value: 360 },
  { label: '12 ساعة', value: 720 },
]

export default function RemindersPage() {
  const { dict } = useLanguage()
  const [settings, update] = useSettings()
  const hydrated = useHydrated()

  const [isSaving, setIsSaving] = useState<
    'salawat' | 'adhkar' | null
  >(null)

  const [salawatSound, setSalawatSound] = useState('1')
  const [playingSound, setPlayingSound] = useState<string | null>(null)

  const [exactAlarmAllowed, setExactAlarmAllowed] = useState(true)

  // حالات التذكيرات الأساسية
  const [salawatEnabled, setSalawatEnabled] = useState(false)
  const [salawatInterval, setSalawatInterval] = useState(60)

  const [adhkarEnabled, setAdhkarEnabled] = useState(false)
  const [adhkarInterval, setAdhkarInterval] = useState(180)

  // ✅ حالات التخصيص (المفقودة)
  const [showCustomSalawat, setShowCustomSalawat] = useState(false)
  const [customSalawatValue, setCustomSalawatValue] = useState('')
  const [customSalawatUnit, setCustomSalawatUnit] = useState<'min' | 'hr'>('min')

  const [showCustomAdhkar, setShowCustomAdhkar] = useState(false)
  const [customAdhkarValue, setCustomAdhkarValue] = useState('')
  const [customAdhkarUnit, setCustomAdhkarUnit] = useState<'min' | 'hr'>('min')

  useEffect(() => {
    if (!hydrated) return

    const savedSalawatEnabled = localStorage.getItem('salawat_enabled') === 'true'
    const savedSalawatInterval = Number(localStorage.getItem('salawat_interval') || 60)
    setSalawatEnabled(savedSalawatEnabled)
    setSalawatInterval(savedSalawatInterval)

    const savedAdhkarEnabled = localStorage.getItem('adhkar_enabled') === 'true'
    const savedAdhkarInterval = Number(localStorage.getItem('adhkar_interval') || 180)
    setAdhkarEnabled(savedAdhkarEnabled)
    setAdhkarInterval(savedAdhkarInterval)

    const loadNativeSettings = async () => {
      try {
        if (
          Capacitor.getPlatform() === 'android' &&
          AdhanScheduler &&
          SystemSettings
        ) {
          const statusRes = await AdhanScheduler.status()
          if (statusRes) {
            setExactAlarmAllowed(statusRes.exactAlarmAllowed)
          }

          const res = await SystemSettings.getStringPreference({
            key: 'salawat_sound_id',
          })
          if (res && res.value) {
            setSalawatSound(res.value)
          }
        }
      } catch (e) {
        console.log('Settings error', e)
      }
    }

    loadNativeSettings()
  }, [hydrated])

  // 💾 حفظ تذكير الصلاة على النبي (صوتي)
  const saveSalawatReminder = async (intervalMinutes: number) => {
    if (intervalMinutes <= 0) return
    setIsSaving('salawat')

    try {
      localStorage.setItem('salawat_enabled', 'true')
      localStorage.setItem('salawat_interval', String(intervalMinutes))
      setSalawatEnabled(true)
      setSalawatInterval(intervalMinutes)

      if (Capacitor.getPlatform() === 'android' && AdhanScheduler) {
        const intervalMillis = intervalMinutes * 60 * 1000
        await AdhanScheduler.scheduleReminder({
          id: REMINDER_ID_SALAWAT,
          intervalMillis,
          title: SALAWAT_TITLE,
          body: SALAWAT_BODY,
          isSilent: false, // ✅ صوتي
        })
      }
    } catch (e) {
      console.log('Schedule salawat error', e)
    } finally {
      setIsSaving(null)
      setShowCustomSalawat(false)
    }
  }

  // 💾 حفظ تذكير الأذكار (صامت)
  const saveAdhkarReminder = async (intervalMinutes: number) => {
    if (intervalMinutes <= 0) return
    setIsSaving('adhkar')

    try {
      localStorage.setItem('adhkar_enabled', 'true')
      localStorage.setItem('adhkar_interval', String(intervalMinutes))
      setAdhkarEnabled(true)
      setAdhkarInterval(intervalMinutes)

      if (Capacitor.getPlatform() === 'android' && AdhanScheduler) {
        const intervalMillis = intervalMinutes * 60 * 1000
        await AdhanScheduler.scheduleReminder({
          id: REMINDER_ID_ADHKAR,
          intervalMillis,
          title: ADHKAR_TITLE,
          body: ADHKAR_BODY,
          isSilent: true, // ✅ صامت
        })
      }
    } catch (e) {
      console.log('Schedule adhkar error', e)
    } finally {
      setIsSaving(null)
      setShowCustomAdhkar(false)
    }
  }

  // 💾 حفظ التخصيص (الصلاة على النبي)
  const handleSaveCustomSalawat = () => {
    const value = parseInt(customSalawatValue, 10)
    if (isNaN(value) || value <= 0) {
      alert(dict.remindersPage.errors.invalidNumber)
      return
    }
    const minutes = customSalawatUnit === 'hr' ? value * 60 : value
    saveSalawatReminder(minutes)
  }

  // 💾 حفظ التخصيص (الأذكار)
  const handleSaveCustomAdhkar = () => {
    const value = parseInt(customAdhkarValue, 10)
    if (isNaN(value) || value <= 0) {
      alert(dict.remindersPage.errors.invalidNumber)
      return
    }
    const minutes = customAdhkarUnit === 'hr' ? value * 60 : value
    saveAdhkarReminder(minutes)
  }

  // 🛑 إيقاف التذكيرات
  const disableSalawatReminder = async () => {
    localStorage.setItem('salawat_enabled', 'false')
    setSalawatEnabled(false)

    if (Capacitor.getPlatform() === 'android' && AdhanScheduler) {
      try {
        await AdhanScheduler.cancelReminder({ id: REMINDER_ID_SALAWAT })
      } catch (e) {
        console.log('Cancel salawat error', e)
      }
    }
  }

  const disableAdhkarReminder = async () => {
    localStorage.setItem('adhkar_enabled', 'false')
    setAdhkarEnabled(false)

    if (Capacitor.getPlatform() === 'android' && AdhanScheduler) {
      try {
        await AdhanScheduler.cancelReminder({ id: REMINDER_ID_ADHKAR })
      } catch (e) {
        console.log('Cancel adhkar error', e)
      }
    }
  }

  const stopPreview = () => {
    if (previewAudio) {
      previewAudio.pause()
      previewAudio.currentTime = 0
      previewAudio = null
    }
    setPlayingSound(null)
  }

  const togglePreview = (soundId: string) => {
    if (playingSound === soundId) {
      stopPreview()
      return
    }

    stopPreview()

    const fileName =
      soundId === '1'
        ? 'salawat_voice.mp3'
        : `salawat_voice_${soundId}.mp3`

    const audio = new Audio(`/audio/salawat/${fileName}`)
    audio.onended = () => stopPreview()

    audio
      .play()
      .then(() => {
        previewAudio = audio
        setPlayingSound(soundId)
      })
      .catch(() => {
        alert(dict.remindersPage.errors.audioNotFound)
        stopPreview()
      })
  }

  const handleSoundChange = async (val: string) => {
    stopPreview()
    setSalawatSound(val)

    if (Capacitor.getPlatform() === 'android' && SystemSettings) {
      try {
        await SystemSettings.setStringPreference({
          key: 'salawat_sound_id',
          value: val,
        })
      } catch (e) {}
    }
  }

  const requestExactAlarm = async () => {
    try {
      if (!AdhanScheduler) return
      await AdhanScheduler.requestExactAlarm()
      setTimeout(async () => {
        const res = await AdhanScheduler.status()
        if (res) {
          setExactAlarmAllowed(res.exactAlarmAllowed)
        }
      }, 1500)
    } catch (e) {
      console.log(e)
    }
  }

  if (!hydrated) return null

  return (
    <div className="min-h-dvh bg-[#f7f3ea] pb-24" dir="rtl">
      <div className="container mx-auto px-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 max-w-3xl space-y-6">
        <PageHeader
          title={dict.remindersPage.title}
          subtitle={dict.remindersPage.subtitle}
          backHref="/more"
        />

        {!exactAlarmAllowed && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
            <AlertTriangle className="mt-0.5 size-6 shrink-0 text-red-600 dark:text-red-500" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 dark:text-red-100">
                {dict.remindersPage.exactAlarmTitle}
              </h3>
              <p className="mt-1 text-xs text-red-800 dark:text-red-200">
                {dict.remindersPage.exactAlarmDesc}
              </p>
              <button
                type="button"
                onClick={requestExactAlarm}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
              >
                {dict.remindersPage.exactAlarmButton}
              </button>
            </div>
          </div>
        )}

        {/* ==================== قسم الصلاة على النبي ==================== */}
        <section className="rounded-3xl bg-white p-5 shadow-sm border border-[#e8dccb]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                <Heart className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-[#0a1f1a]">
                  {dict.remindersPage.salawatTitle}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {dict.remindersPage.salawatDesc}
                </p>
              </div>
            </div>

            {/* زر التخصيص */}
            <button
              type="button"
              onClick={() => setShowCustomSalawat(!showCustomSalawat)}
              className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline"
            >
              {showCustomSalawat ? (
                <>
                  <ArrowRight className="size-3" /> {dict.remindersPage.back}
                </>
              ) : (
                <>
                  <Settings2 className="size-3" /> {dict.remindersPage.customize}
                </>
              )}
            </button>
          </div>

          {/* حقول التخصيص */}
          {showCustomSalawat ? (
            <div className="flex items-center gap-2 bg-[#f4ece1] p-2 rounded-xl relative z-10">
              <input
                type="number"
                min="1"
                value={customSalawatValue}
                onChange={(e) => setCustomSalawatValue(e.target.value)}
                placeholder={dict.remindersPage.intervals.count}
                className="w-16 rounded-lg border border-[#e8dccb] px-2 py-1.5 text-center text-sm bg-white"
              />
              <select
                value={customSalawatUnit}
                onChange={(e) => setCustomSalawatUnit(e.target.value as 'min' | 'hr')}
                className="rounded-lg border border-[#e8dccb] px-1 py-1.5 text-sm bg-white flex-1"
              >
                <option value="min">{dict.remindersPage.intervals.min}</option>
                <option value="hr">{dict.remindersPage.intervals.hr}</option>
              </select>
              <button
                type="button"
                onClick={handleSaveCustomSalawat}
                disabled={isSaving === 'salawat'}
                className="flex-1 rounded-lg bg-[#0a1f1a] py-2 text-sm text-white font-bold transition-all active:scale-95 disabled:opacity-70 shadow-md"
              >
                {isSaving === 'salawat' ? dict.remindersPage.saving : dict.remindersPage.save}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3.5" /> {dict.remindersPage.reminderEvery}
                </p>
              </div>

              <div className="flex gap-2">
                {INTERVAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => saveSalawatReminder(opt.value)}
                    className={cn(
                      'flex-1 rounded-xl py-2 text-xs font-medium transition active:scale-95',
                      salawatInterval === opt.value && salawatEnabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#f4ece1] text-[#5a3e1b]',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* زر التشغيل / الإيقاف */}
          <div className="mt-4 flex items-center justify-between border-t border-[#e8dccb] pt-4">
            <p className="text-sm font-bold text-[#0a1f1a]">تشغيل التذكير</p>
            <button
              type="button"
              onClick={() => {
                if (salawatEnabled) {
                  disableSalawatReminder()
                } else {
                  saveSalawatReminder(salawatInterval)
                }
              }}
              className={cn(
                'flex size-10 items-center justify-center rounded-xl transition active:scale-90',
                salawatEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-200 text-gray-600',
              )}
            >
              {salawatEnabled ? (
                <Bell className="size-5" />
              ) : (
                <BellOff className="size-5" />
              )}
            </button>
          </div>

          {/* نغمة التذكير */}
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Music className="size-3.5" /> {dict.remindersPage.tone}
            </p>
            <div className="flex items-center gap-2">
              <select
                value={salawatSound}
                onChange={(e) => handleSoundChange(e.target.value)}
                className="flex-1 rounded-xl border border-[#e8dccb] bg-[#f4ece1] px-3 py-2.5 text-sm text-[#0a1f1a]"
              >
                <option value="1">{dict.remindersPage.sounds['1']}</option>
                <option value="2">{dict.remindersPage.sounds['2']}</option>
              </select>
              <button
                type="button"
                onClick={() => togglePreview(salawatSound)}
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl transition active:scale-90',
                  playingSound === salawatSound
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-100 text-rose-700 hover:bg-rose-200',
                )}
              >
                {playingSound === salawatSound ? (
                  <Square className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ==================== قسم تذكير الأذكار ==================== */}
        <section className="rounded-3xl bg-white p-5 shadow-sm border border-[#e8dccb]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                <BookOpen className="size-5" />
              </span>
              <div>
                <h3 className="font-bold text-[#0a1f1a]">
                  {dict.remindersPage.adhkarTitle}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {dict.remindersPage.adhkarDesc}
                </p>
              </div>
            </div>

            {/* زر التخصيص */}
            <button
              type="button"
              onClick={() => setShowCustomAdhkar(!showCustomAdhkar)}
              className="text-xs font-bold text-blue-700 flex items-center gap-1 hover:underline"
            >
              {showCustomAdhkar ? (
                <>
                  <ArrowRight className="size-3" /> {dict.remindersPage.back}
                </>
              ) : (
                <>
                  <Settings2 className="size-3" /> {dict.remindersPage.customize}
                </>
              )}
            </button>
          </div>

          {/* حقول التخصيص */}
          {showCustomAdhkar ? (
            <div className="flex items-center gap-2 bg-[#f4ece1] p-2 rounded-xl relative z-10">
              <input
                type="number"
                min="1"
                value={customAdhkarValue}
                onChange={(e) => setCustomAdhkarValue(e.target.value)}
                placeholder={dict.remindersPage.intervals.count}
                className="w-16 rounded-lg border border-[#e8dccb] px-2 py-1.5 text-center text-sm bg-white"
              />
              <select
                value={customAdhkarUnit}
                onChange={(e) => setCustomAdhkarUnit(e.target.value as 'min' | 'hr')}
                className="rounded-lg border border-[#e8dccb] px-1 py-1.5 text-sm bg-white flex-1"
              >
                <option value="min">{dict.remindersPage.intervals.min}</option>
                <option value="hr">{dict.remindersPage.intervals.hr}</option>
              </select>
              <button
                type="button"
                onClick={handleSaveCustomAdhkar}
                disabled={isSaving === 'adhkar'}
                className="flex-1 rounded-lg bg-[#0a1f1a] py-2 text-sm text-white font-bold transition-all active:scale-95 disabled:opacity-70 shadow-md"
              >
                {isSaving === 'adhkar' ? dict.remindersPage.saving : dict.remindersPage.save}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3.5" /> {dict.remindersPage.reminderEvery}
                </p>
              </div>

              <div className="flex gap-2">
                {INTERVAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => saveAdhkarReminder(opt.value)}
                    className={cn(
                      'flex-1 rounded-xl py-2 text-xs font-medium transition active:scale-95',
                      adhkarInterval === opt.value && adhkarEnabled
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#f4ece1] text-[#5a3e1b]',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* زر التشغيل / الإيقاف */}
          <div className="mt-4 flex items-center justify-between border-t border-[#e8dccb] pt-4">
            <p className="text-sm font-bold text-[#0a1f1a]">تشغيل التذكير</p>
            <button
              type="button"
              onClick={() => {
                if (adhkarEnabled) {
                  disableAdhkarReminder()
                } else {
                  saveAdhkarReminder(adhkarInterval)
                }
              }}
              className={cn(
                'flex size-10 items-center justify-center rounded-xl transition active:scale-90',
                adhkarEnabled
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600',
              )}
            >
              {adhkarEnabled ? (
                <Bell className="size-5" />
              ) : (
                <BellOff className="size-5" />
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}