'use client'

import { PageHeader } from '@/components/page-header'
import { useSettings, useHydrated } from '@/lib/settings'
import { Heart, BookOpen, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Capacitor } from '@capacitor/core'

export default function RemindersPage() {
  const [settings, update] = useSettings()
  const hydrated = useHydrated()

  const handleReminderToggle = async (
    type: 'salawat' | 'adhkar',
    enabled: boolean,
    minutes: number
  ) => {
    if (Capacitor.getPlatform() === 'android') {
      try {
        const plugin = (window as any).Capacitor.Plugins.AdhanScheduler

        if (!plugin) {
          alert('خطأ: AdhanScheduler غير مسجل في Android')
          return
        }

        const reminderId = type === 'salawat' ? 777 : 888

        if (enabled) {
          const title =
            type === 'salawat'
              ? 'الصلاة على النبي ﷺ'
              : 'تذكير بوردك'

          const body =
            type === 'salawat'
              ? 'صل على الحبيب.. اجعل لسانك رطباً بذكره'
              : 'هل قرأت وردك من القرآن والأذكار اليوم؟'

          await plugin.scheduleReminder({
            id: reminderId,
            intervalMillis: minutes * 60 * 1000,
            title,
            body,
          })

          alert(`تم جدولة التذكير كل ${minutes} دقيقة`)
        } else {
          await plugin.cancelReminder({ id: reminderId })
          alert('تم إلغاء التذكير')
        }
      } catch (error: any) {
        console.error('خطأ في جدولة التذكيرات:', error)

        alert(
          'خطأ: ' +
            (error?.message || JSON.stringify(error))
        )
      }
    }
  }

  if (!hydrated) return null

  return (
    <div className="min-h-dvh bg-[#f7f3ea] pb-24" dir="rtl">
      <div className="container mx-auto px-4 py-4 max-w-3xl space-y-6">
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
              onClick={() => {
                const newState = !settings.salawatEnabled
                update({ salawatEnabled: newState })
                handleReminderToggle('salawat', newState, settings.salawatInterval)
              }}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                settings.salawatEnabled ? 'bg-emerald-600' : 'bg-zinc-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-5 rounded-full bg-white transition-all',
                  settings.salawatEnabled ? 'right-0.5' : 'right-5.5'
                )}
              />
            </button>
          </div>

          {settings.salawatEnabled && (
            <div className="mt-4 pt-4 border-t border-[#e8dccb]">
              <p className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="size-3.5" /> التذكير كل:
              </p>

              <div className="flex gap-2">
                {[30, 60, 120, 180].map((min) => (
                  <button
                    key={min}
                    onClick={() => {
                      update({ salawatInterval: min })
                      handleReminderToggle('salawat', true, min)
                    }}
                    className={cn(
                      'flex-1 rounded-xl py-2 text-sm font-medium transition',
                      settings.salawatInterval === min
                        ? 'bg-[#0a1f1a] text-white'
                        : 'bg-[#f4ece1] text-[#5a3e1b]'
                    )}
                  >
                    {min === 60
                      ? 'ساعة'
                      : min === 120
                        ? 'ساعتان'
                        : min === 180
                          ? '3 ساعات'
                          : `${min} دقيقة`}
                  </button>
                ))}
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
                <p className="text-xs text-muted-foreground">
                  إشعارات لطيفة تسألك: هل قرأت وردك؟
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const newState = !settings.adhkarRemindersEnabled
                update({ adhkarRemindersEnabled: newState })
                handleReminderToggle('adhkar', newState, settings.adhkarRemindersInterval)
              }}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                settings.adhkarRemindersEnabled ? 'bg-emerald-600' : 'bg-zinc-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 size-5 rounded-full bg-white transition-all',
                  settings.adhkarRemindersEnabled ? 'right-0.5' : 'right-5.5'
                )}
              />
            </button>
          </div>

          {settings.adhkarRemindersEnabled && (
            <div className="mt-4 pt-4 border-t border-[#e8dccb]">
              <p className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="size-3.5" /> التذكير كل:
              </p>

              <div className="flex gap-2">
                {[60, 180, 360, 720].map((min) => (
                  <button
                    key={min}
                    onClick={() => {
                      update({ adhkarRemindersInterval: min })
                      handleReminderToggle('adhkar', true, min)
                    }}
                    className={cn(
                      'flex-1 rounded-xl py-2 text-sm font-medium transition',
                      settings.adhkarRemindersInterval === min
                        ? 'bg-[#0a1f1a] text-white'
                        : 'bg-[#f4ece1] text-[#5a3e1b]'
                    )}
                  >
                    {min === 60
                      ? 'ساعة'
                      : min === 180
                        ? '3 ساعات'
                        : min === 360
                          ? '6 ساعات'
                          : '12 ساعة'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="rounded-2xl bg-[#d4af37]/10 p-4 text-center">
          <p className="text-sm text-[#b89965] leading-relaxed">
            قال رسول الله ﷺ: “من صلى عليّ صلاة صلى الله عليه بها عشراً”.
            <br />
            اجعل لسانك رطباً بذكر الله.
          </p>
        </div>
      </div>
    </div>
  )
}