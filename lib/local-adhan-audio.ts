'use client'

export interface LocalAdhanVoice {
  id: string
  name: string
  mimeType: string
  size: number
  createdAt: number
}

const META_STORAGE_KEY = 'local_adhan_voices_meta_v1'
const LOCAL_VOICE_PREFIX = 'local_adhan:'
const DB_NAME = 'sakina_local_adhan_db'
const DB_VERSION = 1
const STORE_NAME = 'audio_blobs'

let activeAudioElement: HTMLAudioElement | null = null
let activeObjectUrl: string | null = null
let activePlayingVoiceId: string | null = null
const listeners = new Set<(playingId: string | null) => void>()

function notifyListeners() {
  listeners.forEach((cb) => {
    try {
      cb(activePlayingVoiceId)
    } catch {
      // تجاهل أخطاء المستمعين
    }
  })
}

export function subscribeLocalAdhanPlayback(cb: (playingId: string | null) => void): () => void {
  listeners.add(cb)
  cb(activePlayingVoiceId)
  return () => {
    listeners.delete(cb)
  }
}

export function getActiveLocalAdhanPlayingId(): string | null {
  return activePlayingVoiceId
}

export function stopLocalAdhanAudio(): void {
  if (activeAudioElement) {
    try {
      activeAudioElement.pause()
      activeAudioElement.currentTime = 0
    } catch {
      // تجاهل أخطاء الإيقاف
    }
    activeAudioElement = null
  }
  if (activeObjectUrl) {
    try {
      URL.revokeObjectURL(activeObjectUrl)
    } catch {
      // تجاهل أخطاء تحرير الرابط
    }
    activeObjectUrl = null
  }
  activePlayingVoiceId = null
  notifyListeners()
}

export function isLocalAdhanVoiceId(id?: string | null): id is string {
  return typeof id === 'string' && id.startsWith(LOCAL_VOICE_PREFIX)
}

function cleanDisplayName(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim()
  return withoutExt || 'أذان مخصص من الجهاز'
}

function readMetaList(): LocalAdhanVoice[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(META_STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item): item is LocalAdhanVoice =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as LocalAdhanVoice).id === 'string' &&
        typeof (item as LocalAdhanVoice).name === 'string',
    )
  } catch {
    return []
  }
}

function writeMetaList(list: LocalAdhanVoice[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(META_STORAGE_KEY, JSON.stringify(list))
  } catch {
    // تجاهل أخطاء التخزين
  }
}

function openAudioDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB غير متاح'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('فشل فتح قاعدة بيانات الصوت'))
  })
}

async function putBlobToDb(id: string, blob: Blob): Promise<void> {
  const db = await openAudioDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(blob, id)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error || new Error('فشل حفظ ملف الصوت'))
    }
  })
}

async function getBlobFromDb(id: string): Promise<Blob | null> {
  const db = await openAudioDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.get(id)
    req.onsuccess = () => {
      const result = req.result
      db.close()
      resolve(result instanceof Blob ? result : null)
    }
    req.onerror = () => {
      db.close()
      reject(req.error || new Error('فشل قراءة ملف الصوت'))
    }
  })
}

async function removeBlobFromDb(id: string): Promise<void> {
  const db = await openAudioDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(id)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error || new Error('فشل حذف ملف الصوت'))
    }
  })
}

export function listLocalAdhanVoices(): LocalAdhanVoice[] {
  return readMetaList()
}

export function getLocalAdhanVoice(id?: string | null): LocalAdhanVoice | undefined {
  if (!id || !isLocalAdhanVoiceId(id)) return undefined
  return readMetaList().find((item) => item.id === id)
}

export async function saveLocalAdhanFile(file: File): Promise<LocalAdhanVoice> {
  const id = `${LOCAL_VOICE_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const blob = file.slice(0, file.size, file.type || 'audio/mpeg')
  await putBlobToDb(id, blob)

  const entry: LocalAdhanVoice = {
    id,
    name: cleanDisplayName(file.name),
    mimeType: file.type || 'audio/mpeg',
    size: file.size,
    createdAt: Date.now(),
  }

  const nextList = [entry, ...readMetaList()]
  writeMetaList(nextList)
  return entry
}

export async function deleteLocalAdhanVoice(id: string): Promise<void> {
  if (!isLocalAdhanVoiceId(id)) return
  if (activePlayingVoiceId === id) {
    stopLocalAdhanAudio()
  }
  try {
    await removeBlobFromDb(id)
  } catch {
    // تجاهل إذا لم يكن موجوداً في IndexedDB
  }
  const nextList = readMetaList().filter((item) => item.id !== id)
  writeMetaList(nextList)
}

export async function createLocalAdhanObjectUrl(id: string): Promise<string | null> {
  if (!isLocalAdhanVoiceId(id)) return null
  const blob = await getBlobFromDb(id)
  if (!blob) return null
  return URL.createObjectURL(blob)
}

/**
 * تشغيل صوت محلي حقيقي من IndexedDB مع إرسال حدث adhan-started لإيقاف أي تلاوة قرآن جارية
 */
export async function playLocalAdhanVoice(id: string): Promise<boolean> {
  if (!isLocalAdhanVoiceId(id)) return false

  if (activePlayingVoiceId === id) {
    stopLocalAdhanAudio()
    return false
  }

  stopLocalAdhanAudio()

  const objectUrl = await createLocalAdhanObjectUrl(id)
  if (!objectUrl) return false

  try {
    window.dispatchEvent(new CustomEvent('adhan-started', { detail: { voiceId: id, local: true } }))
  } catch {
    // تجاهل
  }

  const audio = new Audio(objectUrl)
  audio.volume = 1
  audio.onended = () => {
    stopLocalAdhanAudio()
  }
  audio.onerror = () => {
    stopLocalAdhanAudio()
  }

  try {
    await audio.play()
    activeAudioElement = audio
    activeObjectUrl = objectUrl
    activePlayingVoiceId = id
    notifyListeners()
    return true
  } catch {
    stopLocalAdhanAudio()
    return false
  }
}
