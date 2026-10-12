'use client'

import { Capacitor, registerPlugin } from '@capacitor/core'

// ============ Platform Detection ============
export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

// ============ Geolocation ============
export type LocationResult =
  | { status: 'granted'; lat: number; lng: number }
  | { status: 'denied' }
  | { status: 'error'; message: string }

export interface LocationOptions {
  /** هل يُسمح بإظهار نافذة طلب الإذن؟ (نمنعها في التحديثات الدورية حتى لا يتكرر الطلب) */
  askPermission?: boolean
  /** دقة عالية (GPS) تستهلك البطارية؛ للمدن يكفي الموقع التقريبي */
  highAccuracy?: boolean
}

export async function getNativeLocation(opts: LocationOptions = {}): Promise<LocationResult> {
  const { askPermission = true, highAccuracy = true } = opts
  const isNative = isNativePlatform()

  // === APK ===
  if (isNative) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation')
      const perm = await Geolocation.checkPermissions()

      if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
        if (!askPermission) return { status: 'denied' }
        const requested = await Geolocation.requestPermissions()
        if (requested.location !== 'granted' && requested.coarseLocation !== 'granted') {
          return { status: 'denied' }
        }
      }

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: highAccuracy,
        timeout: 20000,
        maximumAge: highAccuracy ? 0 : 10 * 60 * 1000,
      })

      return {
        status: 'granted',
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      }
    } catch (e) {
      return {
        status: 'error',
        message: e instanceof Error ? e.message : 'Native location failed',
      }
    }
  }

  // === Web ===
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return { status: 'error', message: 'المتصفح لا يدعم تحديد الموقع' }
  }

  // ⚠️ إذا رُفض سابقاً
  if (typeof navigator.permissions !== 'undefined') {
    try {
      const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
      if (perm.state === 'denied') {
        return { status: 'denied' }
      }
      if (perm.state === 'prompt' && !askPermission) {
        return { status: 'denied' }
      }
    } catch {
      // بعض المتصفحات لا تدعم استعلام الأذونات
    }
  }

  return new Promise<LocationResult>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          status: 'granted',
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      (err) => {
        if (err.code === 1) {
          resolve({ status: 'denied' })
        } else if (err.code === 2) {
          resolve({ status: 'error', message: 'الموقع غير متوفر' })
        } else if (err.code === 3) {
          resolve({ status: 'error', message: 'انتهت مدة الانتظار' })
        } else {
          resolve({ status: 'error', message: 'خطأ غير معروف' })
        }
      },
      { enableHighAccuracy: highAccuracy, timeout: 20000, maximumAge: 10 * 60 * 1000 }
    )
  })
}

// ============ Notifications ============
export type NotifPermission = 'granted' | 'denied' | 'prompt' | 'unsupported'

export function getNotificationStatus(): NotifPermission {
  // === APK ===
  if (isNativePlatform()) {
    // لا يمكن معرفة الحالة بدون async
    return 'prompt'
  }

  // === Web ===
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission as NotifPermission
}

/** الحالة الفعلية للصلاحية (في التطبيق تُقرأ من النظام، وفي المتصفح من Notification) */
export async function getNotificationStatusAsync(): Promise<NotifPermission> {
  if (isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const perm = await LocalNotifications.checkPermissions()
      if (perm.display === 'granted') return 'granted'
      if (perm.display === 'denied') return 'denied'
      return 'prompt'
    } catch {
      return 'prompt'
    }
  }
  return getNotificationStatus()
}

export async function requestNativeNotificationPermission(): Promise<NotifPermission> {
  const isNative = isNativePlatform()

  // === APK ===
  if (isNative) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const perm = await LocalNotifications.checkPermissions()

      if (perm.display === 'granted') return 'granted'

      const requested = await LocalNotifications.requestPermissions()
      return requested.display === 'granted' ? 'granted' : 'denied'
    } catch (e) {
      console.warn('Native notification failed:', e)
      return 'denied'
    }
  }

  // === Web ===
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'

  try {
    const result = await Notification.requestPermission()
    return result as NotifPermission
  } catch {
    return 'denied'
  }
}

export async function showNativeNotification(title: string, body: string): Promise<void> {
  const isNative = isNativePlatform()

  // === APK ===
  if (isNative) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 100000),
            title,
            body,
            schedule: { at: new Date(Date.now() + 500) },
            smallIcon: 'ic_stat_adhan',
            iconColor: '#065F46',
          },
        ],
      })
      return
    } catch (e) {
      console.warn('Native notification failed:', e)
    }
  }

  // === Web ===
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return

  try {
    new Notification(title, {
      body,
      icon: '/icon-512.png',
      dir: 'rtl',
      lang: 'ar',
    })
  } catch (e) {
    console.warn('Web notification failed:', e)
  }
}

// ============ App State ============
export function registerAppStateListener(onResume: () => void): () => void {
  let cleanup: (() => void) | null = null

  if (isNativePlatform()) {
    import('@capacitor/app').then(({ App }) => {
      App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) onResume()
      }).then((listener) => {
        cleanup = () => listener.remove()
      })
    })
  }

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') onResume()
  }
  document.addEventListener('visibilitychange', handleVisibility)

  return () => {
    document.removeEventListener('visibilitychange', handleVisibility)
    if (cleanup) cleanup()
  }
}

// ============ Native Adhan Scheduler (Android) ============
export interface ScheduledItem {
  id: number
  at: number // epoch ms
  kind: 'adhan' | 'reminder'
  prayer: string
  title: string
  body: string
  file?: string // اسم ملف الأذان داخل public/audio/adhans
  volume?: number // 0..1
}

interface AdhanSchedulerPlugin {
  schedule(opts: { items: ScheduledItem[]; persistent: boolean; city: string }): Promise<{
    scheduled: number
    exactAlarmAllowed: boolean
  }>
  status(): Promise<{ exactAlarmAllowed: boolean; notificationsEnabled: boolean; persistent: boolean }>
  requestExactAlarm(): Promise<void>
  setPersistent(opts: { enabled: boolean }): Promise<void>
  stopAdhan(): Promise<void>
  testAdhan(opts: { seconds: number; file: string; volume: number }): Promise<void>
  cancelAll(): Promise<void>
}

let schedulerPlugin: AdhanSchedulerPlugin | null = null

function getScheduler(): AdhanSchedulerPlugin | null {
  if (!isNativePlatform()) return null
  try {
    if (!Capacitor.isPluginAvailable('AdhanScheduler')) return null // نسخة قديمة من التطبيق بلا الإضافة
    if (!schedulerPlugin) schedulerPlugin = registerPlugin<AdhanSchedulerPlugin>('AdhanScheduler')
    return schedulerPlugin
  } catch {
    return null
  }
}

export function isAdhanSchedulerAvailable(): boolean {
  return getScheduler() !== null
}

export async function scheduleNativeAdhans(items: ScheduledItem[], persistent: boolean, city: string) {
  const p = getScheduler()
  if (!p) return null
  try {
    return await p.schedule({ items, persistent, city })
  } catch (e) {
    console.warn('scheduleNativeAdhans failed:', e)
    return null
  }
}

export async function getNativeAlarmStatus() {
  const p = getScheduler()
  if (!p) return null
  try {
    return await p.status()
  } catch {
    return null
  }
}

export async function requestExactAlarmPermission() {
  const p = getScheduler()
  if (!p) return
  try {
    await p.requestExactAlarm()
  } catch {}
}

export async function setPersistentNotification(enabled: boolean) {
  const p = getScheduler()
  if (!p) return
  try {
    await p.setPersistent({ enabled })
  } catch {}
}

export async function testNativeAdhan(seconds: number, file: string, volume: number): Promise<boolean> {
  const p = getScheduler()
  if (!p) return false
  try {
    await p.testAdhan({ seconds, file, volume })
    return true
  } catch {
    return false
  }
}

export async function stopNativeAdhan() {
  const p = getScheduler()
  if (!p) return
  try {
    await p.stopAdhan()
  } catch {}
}

// ============ Exit / Back ============
export async function exitNativeApp(): Promise<void> {
  if (!isNativePlatform()) return
  try {
    await stopNativeAdhan()
    const { App } = await import('@capacitor/app')
    await App.exitApp()
  } catch (e) {
    console.warn('exitApp failed:', e)
  }
}
