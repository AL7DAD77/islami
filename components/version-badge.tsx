'use client'

import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

export function VersionBadge() {
  const [versionInfo, setVersionInfo] = useState<{ version: string; build: string } | null>(null)

  useEffect(() => {
    async function fetchVersion() {
      try {
        // إذا كنا على الهاتف (أندرويد)، نقرأ الرقم من نظام التشغيل مباشرة
        if (Capacitor.isNativePlatform()) {
          const info = await App.getInfo()
          setVersionInfo({ version: info.version, build: info.build })
        } else {
          // إذا كنا على المتصفح (للتجربة)، نضع رقماً افتراضياً
          setVersionInfo({ version: '1.1.0', build: '7' })
        }
      } catch (error) {
        console.warn('لم يتم العثور على معلومات الإصدار', error)
        setVersionInfo({ version: '1.1.0', build: '7' }) // احتياطي
      }
    }

    fetchVersion()
  }, [])

  if (!versionInfo) {
    return <span className="text-sm text-muted-foreground">...</span>
  }

  return (
    <span className="text-sm text-muted-foreground font-sans">
      الإصدار ({versionInfo.build}) {versionInfo.version}
    </span>
  )
}