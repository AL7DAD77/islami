'use client'

import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

export function VersionBadge() {
  const [versionInfo, setVersionInfo] = useState<{ version: string; build: string } | null>(null)

  useEffect(() => {
    async function fetchVersion() {
      try {
        if (Capacitor.isNativePlatform()) {
          const info = await App.getInfo()
          setVersionInfo({ version: info.version, build: info.build })
        } else {
          setVersionInfo({ version: '1.1.0', build: '7' })
        }
      } catch (error) {
        setVersionInfo({ version: '1.1.0', build: '7' })
      }
    }
    fetchVersion()
  }, [])

  if (!versionInfo) return <span className="text-sm text-zinc-500">...</span>

  return (
    <span className="text-sm text-zinc-500 dark:text-zinc-400">
      الإصدار {versionInfo.version} ({versionInfo.build})
    </span>
  )
}