'use client'

import { Capacitor, registerPlugin } from '@capacitor/core'

/* ============================== الأنواع ============================== */

export type LocationResult =
  | {
      status: 'granted'
      lat: number
      lng: number
    }
  | {
      status: 'denied'
    }
  | {
      status: 'error'
      message: string
    }

export interface LocationOptions {
  askPermission?: boolean
  highAccuracy?: boolean
}

export type NotifPermission =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'unsupported'

export type ScheduledItemKind =
  | 'adhan'
  | 'reminder'
  | 'time'
  | 'phase'

export interface ScheduledItem {
  id: number
  at: number
  kind: ScheduledItemKind
  prayer: string
  title: string
  body: string
  file?: string
  volume?: number
}

export interface NativeAlarmStatus {
  exactAlarmAllowed: boolean
  notificationsEnabled: boolean
  persistent: boolean
}

export interface ScheduleNativeResult {
  scheduled: number
  exactAlarmAllowed: boolean
}

interface AdhanSchedulerPlugin {
  schedule(options: {
    items: ScheduledItem[]
    persistent: boolean
    city: string
  }): Promise<ScheduleNativeResult>

  status(): Promise<NativeAlarmStatus>

  requestExactAlarm(): Promise<void>

  setPersistent(options: {
    enabled: boolean
  }): Promise<void>

  stopAdhan(): Promise<void>

  testAdhan(options: {
    seconds: number
    file: string
    volume: number
  }): Promise<void>

  cancelAll(): Promise<void>
}

/* ============================== الثوابت ============================== */

const LOCATION_TIMEOUT_MS = 20_000
const LOCATION_MAX_AGE_MS = 10 * 60 * 1000

const NOTIFICATION_DELAY_MS = 500
const ADHAN_PLUGIN_NAME = 'AdhanScheduler'

const NATIVE_NOTIFICATION_ICON = 'ic_stat_adhan'
const NATIVE_NOTIFICATION_COLOR = '#065F46'

const WEB_NOTIFICATION_ICON = '/icon-512.png'

/* ========================== كشف المنصة ========================== */

export function isNativePlatform(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

/* ============================ تحديد الموقع ============================ */

export async function getNativeLocation(
  options: LocationOptions = {},
): Promise<LocationResult> {
  const {
    askPermission = true,
    highAccuracy = true,
  } = options

  if (isNativePlatform()) {
    return getDeviceLocation({
      askPermission,
      highAccuracy,
    })
  }

  return getBrowserLocation({
    askPermission,
    highAccuracy,
  })
}

async function getDeviceLocation(
  options: Required<LocationOptions>,
): Promise<LocationResult> {
  const { askPermission, highAccuracy } = options

  try {
    const { Geolocation } = await import('@capacitor/geolocation')

    const currentPermission = await Geolocation.checkPermissions()

    const hasPermission =
      currentPermission.location === 'granted' ||
      currentPermission.coarseLocation === 'granted'

    if (!hasPermission) {
      if (!askPermission) {
        return { status: 'denied' }
      }

      const requestedPermission =
        await Geolocation.requestPermissions()

      const granted =
        requestedPermission.location === 'granted' ||
        requestedPermission.coarseLocation === 'granted'

      if (!granted) {
        return { status: 'denied' }
      }
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: highAccuracy,
      timeout: LOCATION_TIMEOUT_MS,
      maximumAge: highAccuracy ? 0 : LOCATION_MAX_AGE_MS,
    })

    return {
      status: 'granted',
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    }
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'تعذر تحديد الموقع على الجهاز',
    }
  }
}

async function getBrowserLocation(
  options: Required<LocationOptions>,
): Promise<LocationResult> {
  const { askPermission, highAccuracy } = options

  if (
    typeof navigator === 'undefined' ||
    !('geolocation' in navigator)
  ) {
    return {
      status: 'error',
      message: 'المتصفح لا يدعم تحديد الموقع',
    }
  }

  const permissionState = await getBrowserLocationPermission()

  if (permissionState === 'denied') {
    return { status: 'denied' }
  }

  if (permissionState === 'prompt' && !askPermission) {
    return { status: 'denied' }
  }

  return new Promise<LocationResult>(resolve => {
    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          status: 'granted',
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      error => {
        if (error.code === 1) {
          resolve({ status: 'denied' })
          return
        }

        resolve({
          status: 'error',
          message: getBrowserLocationErrorMessage(error.code),
        })
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: LOCATION_TIMEOUT_MS,
        maximumAge: LOCATION_MAX_AGE_MS,
      },
    )
  })
}

async function getBrowserLocationPermission(): Promise<
  'granted' | 'denied' | 'prompt' | 'unsupported'
> {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.permissions === 'undefined'
  ) {
    return 'prompt'
  }

  try {
    const permission = await navigator.permissions.query({
      name: 'geolocation' as PermissionName,
    })

    return permission.state as
      | 'granted'
      | 'denied'
      | 'prompt'
  } catch {
    return 'prompt'
  }
}

function getBrowserLocationErrorMessage(errorCode: number): string {
  switch (errorCode) {
    case 2:
      return 'الموقع غير متوفر حاليًا'

    case 3:
      return 'انتهت مدة الانتظار أثناء تحديد الموقع'

    default:
      return 'حدث خطأ غير معروف أثناء تحديد الموقع'
  }
}

/* ============================ الإشعارات ============================ */

export function getNotificationStatus(): NotifPermission {
  if (isNativePlatform()) {
    return 'prompt'
  }

  if (typeof Notification === 'undefined') {
    return 'unsupported'
  }

  return Notification.permission as NotifPermission
}

export async function getNotificationStatusAsync(): Promise<NotifPermission> {
  if (isNativePlatform()) {
    return getDeviceNotificationStatus()
  }

  return getNotificationStatus()
}

async function getDeviceNotificationStatus(): Promise<NotifPermission> {
  try {
    const { LocalNotifications } = await import(
      '@capacitor/local-notifications'
    )

    const permission = await LocalNotifications.checkPermissions()

    if (permission.display === 'granted') {
      return 'granted'
    }

    if (permission.display === 'denied') {
      return 'denied'
    }

    return 'prompt'
  } catch (error) {
    console.warn('تعذر فحص إذن الإشعارات:', error)
    return 'prompt'
  }
}

export async function requestNativeNotificationPermission(): Promise<NotifPermission> {
  if (isNativePlatform()) {
    return requestDeviceNotificationPermission()
  }

  return requestBrowserNotificationPermission()
}

async function requestDeviceNotificationPermission(): Promise<NotifPermission> {
  try {
    const { LocalNotifications } = await import(
      '@capacitor/local-notifications'
    )

    const currentPermission =
      await LocalNotifications.checkPermissions()

    if (currentPermission.display === 'granted') {
      return 'granted'
    }

    const requestedPermission =
      await LocalNotifications.requestPermissions()

    return requestedPermission.display === 'granted'
      ? 'granted'
      : 'denied'
  } catch (error) {
    console.warn('تعذر طلب إذن الإشعارات:', error)
    return 'denied'
  }
}

async function requestBrowserNotificationPermission(): Promise<NotifPermission> {
  if (typeof Notification === 'undefined') {
    return 'unsupported'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  try {
    const result = await Notification.requestPermission()

    return result as NotifPermission
  } catch (error) {
    console.warn('تعذر طلب إذن إشعارات المتصفح:', error)
    return 'denied'
  }
}

export async function showNativeNotification(
  title: string,
  body: string,
): Promise<void> {
  if (isNativePlatform()) {
    await showDeviceNotification(title, body)
    return
  }

  showBrowserNotification(title, body)
}

async function showDeviceNotification(
  title: string,
  body: string,
): Promise<void> {
  try {
    const { LocalNotifications } = await import(
      '@capacitor/local-notifications'
    )

    await LocalNotifications.schedule({
      notifications: [
        {
          id: generateNotificationId(),
          title,
          body,
          schedule: {
            at: new Date(Date.now() + NOTIFICATION_DELAY_MS),
          },
          smallIcon: NATIVE_NOTIFICATION_ICON,
          iconColor: NATIVE_NOTIFICATION_COLOR,
        },
      ],
    })
  } catch (error) {
    console.warn('تعذر إظهار إشعار الجهاز:', error)
  }
}

function showBrowserNotification(
  title: string,
  body: string,
): void {
  if (
    typeof Notification === 'undefined' ||
    Notification.permission !== 'granted'
  ) {
    return
  }

  try {
    new Notification(title, {
      body,
      icon: WEB_NOTIFICATION_ICON,
      dir: 'rtl',
      lang: 'ar',
    })
  } catch (error) {
    console.warn('تعذر إظهار إشعار المتصفح:', error)
  }
}

function generateNotificationId(): number {
  return Math.floor(Math.random() * 100_000)
}

/* ============================ حالة التطبيق ============================ */

export function registerAppStateListener(
  onResume: () => void,
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  let isCleanedUp = false
  let removeDeviceListener: (() => void) | null = null

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      onResume()
    }
  }

  document.addEventListener(
    'visibilitychange',
    handleVisibilityChange,
  )

  if (isNativePlatform()) {
    registerDeviceAppStateListener(onResume)
      .then(removeListener => {
        if (isCleanedUp) {
          removeListener?.()
          return
        }

        removeDeviceListener = removeListener
      })
      .catch(error => {
        console.warn('تعذر الاستماع لتغير حالة التطبيق:', error)
      })
  }

  return () => {
    isCleanedUp = true

    document.removeEventListener(
      'visibilitychange',
      handleVisibilityChange,
    )

    removeDeviceListener?.()
    removeDeviceListener = null
  }
}

async function registerDeviceAppStateListener(
  onResume: () => void,
): Promise<() => void> {
  const { App } = await import('@capacitor/app')

  const listener = await App.addListener(
    'appStateChange',
    ({ isActive }) => {
      if (isActive) {
        onResume()
      }
    },
  )

  return () => {
    listener.remove()
  }
}

/* ======================= جدولة الأذان الأصلية ======================= */

let schedulerPlugin: AdhanSchedulerPlugin | null = null

function getScheduler(): AdhanSchedulerPlugin | null {
  if (!isNativePlatform()) {
    return null
  }

  try {
    if (!Capacitor.isPluginAvailable(ADHAN_PLUGIN_NAME)) {
      return null
    }

    if (!schedulerPlugin) {
      schedulerPlugin = registerPlugin<AdhanSchedulerPlugin>(
        ADHAN_PLUGIN_NAME,
      )
    }

    return schedulerPlugin
  } catch (error) {
    console.warn('تعذر تحميل إضافة جدولة الأذان:', error)
    return null
  }
}

export function isAdhanSchedulerAvailable(): boolean {
  return getScheduler() !== null
}

export async function scheduleNativeAdhans(
  items: ScheduledItem[],
  persistent: boolean,
  city: string,
): Promise<ScheduleNativeResult | null> {
  const scheduler = getScheduler()

  if (!scheduler) {
    return null
  }

  try {
    return await scheduler.schedule({
      items,
      persistent,
      city,
    })
  } catch (error) {
    console.warn('تعذر جدولة الأذان على الجهاز:', error)
    return null
  }
}

export async function getNativeAlarmStatus(): Promise<NativeAlarmStatus | null> {
  const scheduler = getScheduler()

  if (!scheduler) {
    return null
  }

  try {
    return await scheduler.status()
  } catch (error) {
    console.warn('تعذر جلب حالة جدولة الأذان:', error)
    return null
  }
}

export async function requestExactAlarmPermission(): Promise<void> {
  const scheduler = getScheduler()

  if (!scheduler) {
    return
  }

  try {
    await scheduler.requestExactAlarm()
  } catch (error) {
    console.warn('تعذر طلب إذن التنبيهات الدقيقة:', error)
  }
}

export async function setPersistentNotification(
  enabled: boolean,
): Promise<void> {
  const scheduler = getScheduler()

  if (!scheduler) {
    return
  }

  try {
    await scheduler.setPersistent({ enabled })
  } catch (error) {
    console.warn('تعذر تحديث الإشعار الدائم:', error)
  }
}

export async function testNativeAdhan(
  seconds: number,
  file: string,
  volume: number,
): Promise<boolean> {
  const scheduler = getScheduler()

  if (!scheduler) {
    return false
  }

  try {
    await scheduler.testAdhan({
      seconds,
      file,
      volume,
    })

    return true
  } catch (error) {
    console.warn('تعذر تشغيل اختبار الأذان:', error)
    return false
  }
}

export async function stopNativeAdhan(): Promise<void> {
  const scheduler = getScheduler()

  if (!scheduler) {
    return
  }

  try {
    await scheduler.stopAdhan()
  } catch (error) {
    console.warn('تعذر إيقاف الأذان:', error)
  }
}

/* ============================ إنهاء التطبيق ============================ */

export async function exitNativeApp(): Promise<void> {
  if (!isNativePlatform()) {
    return
  }

  try {
    await stopNativeAdhan()

    const { App } = await import('@capacitor/app')
    await App.exitApp()
  } catch (error) {
    console.warn('تعذر إنهاء التطبيق:', error)
  }
}