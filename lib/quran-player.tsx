'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import type { Reciter } from '@/lib/quran'
import { surahAudioUrl } from '@/lib/quran'
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
  play: (
    surah: number,
    surahName: string,
    reciter: Reciter,
    server: string,
  ) => void
  toggle: () => void
  stop: () => void
  setRepeat: (value: boolean) => void
  changeReciter: (reciter: Reciter, server: string) => void
}

type NativeTrack = {
  id: string
  title: string
  url: string
}

type NativeState = {
  playing: boolean
  loading: boolean
  progress: number
  repeat: boolean
  url: string
  ui: string
  error: string
  index?: number
  title?: string
}

type NativePlugin = {
  play(options: {
    url: string
    title: string
    artist: string
    repeat: boolean
    ui: string
  }): Promise<NativeState>

  playQueue(options: {
    items: NativeTrack[]
    startIndex: number
    repeat: boolean
    ui: string
  }): Promise<NativeState>

  toggle(): Promise<NativeState>
  stop(): Promise<NativeState>
  setRepeat(options: { enabled: boolean }): Promise<NativeState>
  getState(): Promise<NativeState>
}

type Selection = {
  surah: number
  surahName: string
  reciter: Reciter
  server: string
}

type QuranWindow = Window & {
  __stopQuran?: () => void
}

const NativeQuran = registerPlugin<NativePlugin>('QuranPlayer')
const QuranPlayerContext = createContext<PlayerState | null>(null)

function nativePlayerAvailable(): boolean {
  if (typeof window === 'undefined') return false

  try {
    return (
      Capacitor.getPlatform() === 'android' &&
      Capacitor.isPluginAvailable('QuranPlayer')
    )
  } catch {
    return false
  }
}

function buildQueue(
  startSurah: number,
  server: string,
  startSurahName: string,
): NativeTrack[] {
  const items: NativeTrack[] = []

  for (let number = startSurah; number <= 114; number++) {
    items.push({
      id: String(number),
      title:
        number === startSurah
          ? startSurahName
          : `السورة رقم ${number}`,
      url: surahAudioUrl(server, number),
    })
  }

  return items
}

export function QuranPlayerProvider({
  children,
}: {
  children: ReactNode
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentUrlRef = useRef<string>('')

  const [surah, setSurah] = useState<number | null>(null)
  const [surahName, setSurahName] = useState('')
  const [reciter, setReciter] = useState<Reciter | null>(null)
  const [moshafServer, setMoshafServer] = useState<string | null>(null)

  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [repeat, setRepeatState] = useState(false)

  const mountedRef = useRef(false)
  const repeatRef = useRef(false)
  const selectionRef = useRef<Selection | null>(null)
  const lastUiRef = useRef('')
  const lastErrorRef = useRef('')
  const queueStartRef = useRef(1)

  const commandVersionRef = useRef(0)
  const busyRef = useRef(0)

  const applySelection = useCallback((selection: Selection) => {
    selectionRef.current = selection

    setSurah(selection.surah)
    setSurahName(selection.surahName)
    setReciter(selection.reciter)
    setMoshafServer(selection.server)
  }, [])

  const applyNativeState = useCallback(
    (state: NativeState) => {
      if (!mountedRef.current) return

      setPlaying(state.playing)
      setLoading(state.loading)
      setProgress(
        Number.isFinite(state.progress)
          ? Math.max(0, Math.min(100, state.progress))
          : 0,
      )

      repeatRef.current = state.repeat
      setRepeatState(state.repeat)

      if (
        typeof state.index === 'number' &&
        state.index >= 0
      ) {
        const currentSurahNumber =
          queueStartRef.current + state.index

        setSurah(currentSurahNumber)

        if (state.title) {
          setSurahName(state.title)
        }

        const current = selectionRef.current

        if (current) {
          const updated: Selection = {
            ...current,
            surah: currentSurahNumber,
            surahName: state.title || current.surahName,
          }

          selectionRef.current = updated
        }
      }

      if (state.ui && state.ui !== lastUiRef.current) {
        try {
          const saved = JSON.parse(state.ui) as Selection

          if (
            Number.isInteger(saved.surah) &&
            saved.surah >= 1 &&
            saved.surah <= 114 &&
            typeof saved.surahName === 'string' &&
            typeof saved.server === 'string' &&
            saved.reciter &&
            typeof saved.reciter.name === 'string'
          ) {
            applySelection(saved)
            lastUiRef.current = state.ui
          }
        } catch {}
      }

      if (state.error && state.error !== lastErrorRef.current) {
        console.error('Quran native playback error:', state.error)
      }

      lastErrorRef.current = state.error || ''
    },
    [applySelection],
  )

  const runNative = useCallback(
    async (action: () => Promise<NativeState>) => {
      const version = ++commandVersionRef.current
      busyRef.current += 1

      try {
        const state = await action()

        if (version === commandVersionRef.current) {
          applyNativeState(state)
        }
      } catch (error) {
        console.error('Quran native command failed:', error)
      } finally {
        busyRef.current -= 1
      }
    },
    [applyNativeState],
  )

  useEffect(() => {
    mountedRef.current = true

    if (!audioRef.current) {
      const audio = new Audio()
      audio.preload = 'auto'
      audio.dataset.quran = 'true'
      audio.loop = repeatRef.current

      audio.onplaying = () => {
        if (!mountedRef.current) return
        setPlaying(true)
        setLoading(false)
      }

      audio.onpause = () => {
        if (!mountedRef.current) return
      }

      audio.onended = () => {
        if (!mountedRef.current) return
        setPlaying(false)
        setLoading(false)
        setProgress(0)
      }

      audio.onerror = () => {
        if (!mountedRef.current) return
        setPlaying(false)
        setLoading(false)
      }

      audio.ontimeupdate = () => {
        if (!mountedRef.current) return
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          setProgress((audio.currentTime / audio.duration) * 100)
        }
      }

      audioRef.current = audio
    }

    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!nativePlayerAvailable()) return

    let cancelled = false
    let polling = false

    const sync = async () => {
      if (cancelled || polling || busyRef.current > 0) return
      if (document.visibilityState === 'hidden') return

      polling = true
      const version = commandVersionRef.current

      try {
        const state = await NativeQuran.getState()

        if (
          !cancelled &&
          busyRef.current === 0 &&
          version === commandVersionRef.current
        ) {
          applyNativeState(state)
        }
      } catch (error) {
        console.warn('Quran state sync failed:', error)
      } finally {
        polling = false
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void sync()
      }
    }

    void sync()

    const interval = window.setInterval(() => {
      void sync()
    }, 2000)

    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [applyNativeState])

  const stop = useCallback(() => {
    // تتبع مصدر إيقاف المشغل لمعرفة ما إذا كانت أيقونة أخرى هي من تستدعيه
    console.warn('Quran stop() called from:', new Error().stack)

    if (nativePlayerAvailable()) {
      setPlaying(false)
      setLoading(false)
      setProgress(0)

      void runNative(() => NativeQuran.stop())
      return
    }

    const audio = audioRef.current
    if (!audio) return

    audio.pause()

    try {
      audio.currentTime = 0
    } catch {}

    setPlaying(false)
    setLoading(false)
    setProgress(0)
  }, [runNative])

  useEffect(() => {
    const handler = () => stop()
    const quranWindow = window as QuranWindow

    quranWindow.__stopQuran = handler
    window.addEventListener('adhan-started', handler)

    return () => {
      window.removeEventListener('adhan-started', handler)

      if (quranWindow.__stopQuran === handler) {
        delete quranWindow.__stopQuran
      }
    }
  }, [stop])

  useEffect(() => {
    if (nativePlayerAvailable()) return
    if (!reciter || !('mediaSession' in navigator)) return
    if (typeof MediaMetadata === 'undefined') return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: surahName,
      artist: reciter.name,
      album: 'القرآن الكريم',
      artwork: [
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    })
  }, [surahName, reciter])

  const play = (
    number: number,
    name: string,
    selectedReciter: Reciter,
    server: string,
  ) => {
    // فحص بيئة التشغيل للتحقق من المسار الفعلي (كما اقترح صديقك)
    console.log('platform:', Capacitor.getPlatform())
    console.log('plugin available:', Capacitor.isPluginAvailable('QuranPlayer'))
    console.log('native branch:', nativePlayerAvailable())

    const selection: Selection = {
      surah: number,
      surahName: name,
      reciter: selectedReciter,
      server,
    }

    const url = surahAudioUrl(server, number)

    applySelection(selection)
    setLoading(true)

    saveLastPlayed({
      surah: number,
      surahName: name,
      reciterId: selectedReciter.id,
    })

    if (nativePlayerAvailable()) {
      const ui = JSON.stringify(selection)
      lastUiRef.current = ui

      const items = buildQueue(number, server, name)
      queueStartRef.current = number

      void runNative(() =>
        NativeQuran.playQueue({
          items,
          startIndex: 0,
          repeat: repeatRef.current,
          ui,
        }),
      )

      return
    }

    const audio = audioRef.current

    if (!audio) {
      setLoading(false)
      return
    }

    const resolvedUrl = new URL(url, window.location.href).href

    // المقارنة الدقيقة باستخدام الـ Ref لتجنب إعادة ضبط الـ src بالخطأ
    if (currentUrlRef.current !== resolvedUrl) {
      currentUrlRef.current = resolvedUrl
      audio.src = url
      setProgress(0)
      audio.load()
    } else if (audio.paused) {
      setLoading(false)
      void audio.play().catch(() => {})
      return
    }

    audio.loop = repeatRef.current

    void audio.play().catch((error) => {
      console.warn('Quran web play failed:', error)

      if (mountedRef.current) {
        setLoading(false)
        setPlaying(false)
      }
    })
  }

  const toggle = () => {
    if (nativePlayerAvailable()) {
      void runNative(() => NativeQuran.toggle())
      return
    }

    const audio = audioRef.current
    if (!audio || !audio.src) return

    if (audio.paused) {
      setLoading(true)

      void audio.play().catch((error) => {
        console.warn('Quran web resume failed:', error)

        if (mountedRef.current) {
          setLoading(false)
          setPlaying(false)
        }
      })
    } else {
      audio.pause()
      setPlaying(false)
    }
  }

  const setRepeat = (enabled: boolean) => {
    repeatRef.current = enabled
    setRepeatState(enabled)

    if (nativePlayerAvailable()) {
      void runNative(() =>
        NativeQuran.setRepeat({ enabled }),
      )

      return
    }

    if (audioRef.current) {
      audioRef.current.loop = enabled
    }
  }

  const changeReciter = (
    selectedReciter: Reciter,
    server: string,
  ) => {
    const current = selectionRef.current

    if (current) {
      play(
        current.surah,
        current.surahName,
        selectedReciter,
        server,
      )
    } else {
      setReciter(selectedReciter)
      setMoshafServer(server)
    }
  }

  const value: PlayerState = {
    surah,
    surahName,
    reciter,
    moshafServer,
    playing,
    loading,
    progress,
    repeat,
    play,
    toggle,
    stop,
    setRepeat,
    changeReciter,
  }

  return (
    <QuranPlayerContext.Provider value={value}>
      {children}
    </QuranPlayerContext.Provider>
  )
}

export function useQuranPlayer() {
  const context = useContext(QuranPlayerContext)

  if (!context) {
    throw new Error(
      'useQuranPlayer must be used inside QuranPlayerProvider',
    )
  }

  return context
}