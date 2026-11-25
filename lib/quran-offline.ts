'use client'

import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'

export interface OfflineSurahMeta {
  reciterId: string | number
  reciterName: string
  server: string
  surahNumber: number
  surahName: string
  filePath: string
  savedAt: number
  sizeBytes: number
}

export interface DownloadSurahParams {
  reciterId: string | number
  reciterName: string
  server: string
  surahNumber: number
  surahName: string
  signal?: AbortSignal
  onProgress?: (percent: number) => void
}

export interface PlayableSurahSource {
  src: string
  isOffline: boolean
  revokeUrl?: () => void
}

const OFFLINE_INDEX_KEY = 'mushaf-offline-audio-index-v1'
const OFFLINE_CACHE_NAME = 'mushaf-offline-audio-v1'
const AUDIO_ROOT_DIR = 'quran-audio'

function normalizeServerUrl(server: string): string {
  const trimmed = server.trim()
  if (!trimmed) return ''
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`
}

export function buildSurahAudioUrl(
  server: string,
  surahNumber: number,
): string {
  const clampedSurah = Math.min(Math.max(Math.trunc(surahNumber), 1), 114)
  const padded = String(clampedSurah).padStart(3, '0')
  return `${normalizeServerUrl(server)}${padded}.mp3`
}

function makeReciterSlug(reciterId: string | number, server: string): string {
  const safeId = String(reciterId || 'default')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 24)
  const cleanServer = normalizeServerUrl(server)
    .replace(/^https?:\/\//i, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 32)
  return `reciter_${safeId}_${cleanServer || 'srv'}`
}

function makeRelativeFilePath(
  reciterId: string | number,
  server: string,
  surahNumber: number,
): string {
  const clampedSurah = Math.min(Math.max(Math.trunc(surahNumber), 1), 114)
  const padded = String(clampedSurah).padStart(3, '0')
  return `${AUDIO_ROOT_DIR}/${makeReciterSlug(reciterId, server)}/${padded}.mp3`
}

function readOfflineIndex(): Record<string, OfflineSurahMeta> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(OFFLINE_INDEX_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }
    return parsed as Record<string, OfflineSurahMeta>
  } catch {
    return {}
  }
}

function writeOfflineIndex(index: Record<string, OfflineSurahMeta>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(OFFLINE_INDEX_KEY, JSON.stringify(index))
  } catch {
    // تجاهل أخطاء التخزين المحلي عند امتلاء المساحة أو القيود
  }
}

export function getOfflineKey(
  reciterId: string | number,
  server: string,
  surahNumber: number,
): string {
  return `${String(reciterId)}::${normalizeServerUrl(server)}::${Math.trunc(surahNumber)}`
}

export function isSurahDownloaded(
  reciterId: string | number,
  server: string,
  surahNumber: number,
): boolean {
  return Boolean(getOfflineSurahMeta(reciterId, server, surahNumber))
}

export function getOfflineSurahMeta(
  reciterId: string | number,
  server: string,
  surahNumber: number,
): OfflineSurahMeta | null {
  const index = readOfflineIndex()
  return index[getOfflineKey(reciterId, server, surahNumber)] ?? null
}

export function listDownloadedSurahsForReciter(
  reciterId: string | number,
  server: string,
): OfflineSurahMeta[] {
  const index = readOfflineIndex()
  const prefix = `${String(reciterId)}::${normalizeServerUrl(server)}::`
  return Object.entries(index)
    .filter(([key, meta]) => key.startsWith(prefix) && Boolean(meta))
    .map(([, meta]) => meta)
    .sort((a, b) => a.surahNumber - b.surahNumber)
}

export function getReciterOfflineStorageBytes(
  reciterId: string | number,
  server: string,
): number {
  return listDownloadedSurahsForReciter(reciterId, server).reduce(
    (sum, item) => sum + (Number.isFinite(item.sizeBytes) ? item.sizeBytes : 0),
    0,
  )
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, Math.min(i + chunkSize, bytes.length))
    binary += String.fromCharCode(...slice)
  }

  return btoa(binary)
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException('تم إلغاء التحميل', 'AbortError')
  }
}

export async function downloadSurahAudio(
  params: DownloadSurahParams,
): Promise<OfflineSurahMeta> {
  const {
    reciterId,
    reciterName,
    server,
    surahNumber,
    surahName,
    signal,
    onProgress,
  } = params

  throwIfAborted(signal)

  const url = buildSurahAudioUrl(server, surahNumber)
  onProgress?.(5)

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`تعذر تحميل السورة (${response.status})`)
  }

  throwIfAborted(signal)

  const contentLength = Number(response.headers.get('content-length') || 0)
  let blob: Blob

  if (
    response.body &&
    contentLength > 0 &&
    typeof ReadableStream !== 'undefined'
  ) {
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let received = 0

    while (true) {
      throwIfAborted(signal)
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(value)
        received += value.length
        const pct = Math.min(
          85,
          Math.max(10, Math.round((received / contentLength) * 85)),
        )
        onProgress?.(pct)
      }
    }

    const totalBuffer = new Uint8Array(received)
    let offset = 0
    for (const chunk of chunks) {
      totalBuffer.set(chunk, offset)
      offset += chunk.length
    }
    blob = new Blob([totalBuffer], { type: 'audio/mpeg' })
  } else {
    blob = await response.blob()
    onProgress?.(80)
  }

  throwIfAborted(signal)

  const filePath = makeRelativeFilePath(reciterId, server, surahNumber)

  if (Capacitor.isNativePlatform()) {
    const buffer = await blob.arrayBuffer()
    const base64Data = arrayBufferToBase64(buffer)
    throwIfAborted(signal)

    await Filesystem.writeFile({
      path: filePath,
      data: base64Data,
      directory: Directory.Data,
      recursive: true,
    })
  } else if (typeof window !== 'undefined' && 'caches' in window) {
    const cache = await window.caches.open(OFFLINE_CACHE_NAME)
    await cache.put(
      new Request(url),
      new Response(blob, {
        headers: { 'Content-Type': 'audio/mpeg' },
      }),
    )
  }

  throwIfAborted(signal)
  onProgress?.(100)

  const meta: OfflineSurahMeta = {
    reciterId,
    reciterName,
    server: normalizeServerUrl(server),
    surahNumber: Math.min(Math.max(Math.trunc(surahNumber), 1), 114),
    surahName,
    filePath,
    savedAt: Date.now(),
    sizeBytes: blob.size,
  }

  const index = readOfflineIndex()
  index[getOfflineKey(reciterId, server, surahNumber)] = meta
  writeOfflineIndex(index)

  return meta
}

export async function downloadSurahsBatch(params: {
  reciterId: string | number
  reciterName: string
  server: string
  surahs: Array<{ surahNumber: number; surahName: string }>
  signal?: AbortSignal
  onSurahStart?: (surahNumber: number, index: number, total: number) => void
  onSurahProgress?: (surahNumber: number, percent: number) => void
  onSurahComplete?: (meta: OfflineSurahMeta, index: number, total: number) => void
  onSurahError?: (surahNumber: number, error: unknown) => void
}): Promise<OfflineSurahMeta[]> {
  const {
    reciterId,
    reciterName,
    server,
    surahs,
    signal,
    onSurahStart,
    onSurahProgress,
    onSurahComplete,
    onSurahError,
  } = params

  const completed: OfflineSurahMeta[] = []
  const total = surahs.length

  for (let i = 0; i < total; i++) {
    throwIfAborted(signal)
    const item = surahs[i]
    onSurahStart?.(item.surahNumber, i, total)

    try {
      const meta = await downloadSurahAudio({
        reciterId,
        reciterName,
        server,
        surahNumber: item.surahNumber,
        surahName: item.surahName,
        signal,
        onProgress: (pct) => onSurahProgress?.(item.surahNumber, pct),
      })
      completed.push(meta)
      onSurahComplete?.(meta, i, total)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }
      onSurahError?.(item.surahNumber, error)
    }
  }

  return completed
}

export async function resolvePlayableSurahSource(params: {
  reciterId: string | number
  server: string
  surahNumber: number
}): Promise<PlayableSurahSource> {
  const { reciterId, server, surahNumber } = params
  const onlineUrl = buildSurahAudioUrl(server, surahNumber)
  const meta = getOfflineSurahMeta(reciterId, server, surahNumber)

  if (!meta) {
    return { src: onlineUrl, isOffline: false }
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const stat = await Filesystem.stat({
        path: meta.filePath,
        directory: Directory.Data,
      })
      if (stat.uri) {
        return {
          src: Capacitor.convertFileSrc(stat.uri),
          isOffline: true,
        }
      }
    } catch {
      // في حال حذف الملف خارج التطبيق نعود للبث المباشر
    }
  } else if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await window.caches.open(OFFLINE_CACHE_NAME)
      const cached = await cache.match(new Request(onlineUrl))
      if (cached) {
        const blob = await cached.blob()
        const objectUrl = URL.createObjectURL(blob)
        return {
          src: objectUrl,
          isOffline: true,
          revokeUrl: () => URL.revokeObjectURL(objectUrl),
        }
      }
    } catch {
      // تجاهل والعودة للرابط المباشر
    }
  }

  return { src: onlineUrl, isOffline: false }
}

export async function deleteOfflineSurah(params: {
  reciterId: string | number
  server: string
  surahNumber: number
}): Promise<void> {
  const { reciterId, server, surahNumber } = params
  const key = getOfflineKey(reciterId, server, surahNumber)
  const index = readOfflineIndex()
  const meta = index[key]

  if (meta && Capacitor.isNativePlatform()) {
    try {
      await Filesystem.deleteFile({
        path: meta.filePath,
        directory: Directory.Data,
      })
    } catch {
      // تجاهل إذا كان الملف غير موجود مسبقاً
    }
  } else if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await window.caches.open(OFFLINE_CACHE_NAME)
      await cache.delete(new Request(buildSurahAudioUrl(server, surahNumber)))
    } catch {
      // تجاهل
    }
  }

  delete index[key]
  writeOfflineIndex(index)
}

export async function clearOfflineSurahsForReciter(
  reciterId: string | number,
  server: string,
): Promise<void> {
  const list = listDownloadedSurahsForReciter(reciterId, server)
  for (const item of list) {
    await deleteOfflineSurah({
      reciterId,
      server,
      surahNumber: item.surahNumber,
    })
  }
}
