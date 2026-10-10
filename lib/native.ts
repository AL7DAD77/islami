'use client'

import { Capacitor } from '@capacitor/core'

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

export async function getNativeLocation(): Promise<LocationResult> {
  const isNative = isNativePlatform()

  // === APK ===
  if (isNative) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation')
      const perm = await Geolocation.checkPermissions()

      if (perm.location !== 'granted') {
        const requested = await Geolocation.requestPermissions()
        if (requested.location !== 'granted') {
          return { status: 'denied' }
        }
      }

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
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
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
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
            smallIcon: 'ic_stat_icon_config_sample',
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