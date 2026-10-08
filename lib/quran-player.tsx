'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { Reciter } from '@/lib/quran'
import { surahAudioUrl } from '@/lib/quran'
import { useSettings } from '@/lib/settings'
import { saveLastPlayed } from '@/lib/last-played'

type PlayerState = {
  surah: number | null
  surahName: string
  reciter: Reciter | null
  moshafServer: string | null
  playing: boolean
  loading: boolean
  progress: number
  repeat: boolean
  play: (surah: number, surahName: string, reciter: Reciter, server: string) => void
  toggle: () => void
  stop: () => void
  setRepeat: (v: boolean) => void
  changeReciter: (reciter: Reciter, server: string) => void
}

const QuranPlayerContext = createContext<PlayerState | null>(null)

export function QuranPlayerProvider({ children }: { children: React.ReactNode }) {
  const [settings] = useSettings()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [surah, setSurah] = useState<number | null>(null)
  const [surahName, setSurahName] = useState('')
  const [reciter, setReciter] = useState<Reciter | null>(null)
  const [moshafServer, setMoshafServer] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [repeat, setRepeat] = useState(false)

  // إنشاء الصوت مرة واحدة
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'none'
    audio.dataset.quran = 'true'
    audio.onplaying = () => { setPlaying(true); setLoading(false) }
    audio.onpause = () => setPlaying(false)
    audio.onwaiting = () => setLoading(true)
    audio.onended = () => { setPlaying(false); setProgress(0) }
    audio.ontimeupdate = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
    }
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  // تحديث loop
  useEffect(() => {
    if (audioRef.current) audioRef.current.loop = repeat
  }, [repeat])

  // Media Session
  useEffect(() => {
    if (!('mediaSession' in navigator) || !reciter) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: surahName,
      artist: reciter.name,
      album: 'القرآن الكريم',
      artwork: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
    })
  }, [surahName, reciter])

  // إيقاف القرآن عند تشغيل الأذان (عبر الحدث)
  useEffect(() => {
    const handler = () => {
      const a = audioRef.current
      if (a && !a.paused) {
        a.pause()
        a.currentTime = 0
        setPlaying(false)
      }
    }
    window.addEventListener('adhan-started', handler)
    return () => window.removeEventListener('adhan-started', handler)
  }, [])

  // ✅ تسجيل دالة إيقاف عالمية (يستدعيها adhan-engine مباشرة)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).__stopQuran = () => {
        const a = audioRef.current
        if (a && !a.paused) {
          a.pause()
          a.currentTime = 0
          setPlaying(false)
          setProgress(0)
        }
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__stopQuran
      }
    }
  }, [])

  const play = (s: number, name: string, r: Reciter, server: string) => {
    const a = audioRef.current
    if (!a) return
    const url = surahAudioUrl(server, s)
    if (a.src !== url) {
      a.src = url
      a.currentTime = 0
    }
    setSurah(s)
    setSurahName(name)
    setReciter(r)
    setMoshafServer(server)
    setLoading(true)
    saveLastPlayed({ surah: s, surahName: name, reciterId: r.id })
    a.play().catch(() => setLoading(false))
  }

  const toggle = () => {
    const a = audioRef.current
    if (!a || !a.src) return
    if (a.paused) {
      setLoading(true)
      a.play().catch(() => setLoading(false))
    } else {
      a.pause()
    }
  }

  const stop = () => {
    const a = audioRef.current
    if (!a) return
    a.pause()
    a.currentTime = 0
    setPlaying(false)
    setProgress(0)
  }

  const changeReciter = (r: Reciter, server: string) => {
    setReciter(r)
    setMoshafServer(server)
    if (surah !== null && reciter) {
      play(surah, surahName, r, server)
    }
  }

  const value: PlayerState = {
    surah, surahName, reciter, moshafServer,
    playing, loading, progress, repeat,
    play, toggle, stop, setRepeat, changeReciter,
  }

  return <QuranPlayerContext.Provider value={value}>{children}</QuranPlayerContext.Provider>
}

export function useQuranPlayer() {
  const ctx = useContext(QuranPlayerContext)
  if (!ctx) throw new Error('useQuranPlayer must be used inside QuranPlayerProvider')
  return ctx
}