'use client'

const urlCache = new Map<string, string>()

export function getAdhanUrl(file: string): string {
  if (urlCache.has(file)) {
    return urlCache.get(file)!
  }
  const url = `/audio/adhans/${file}`
  urlCache.set(file, url)
  return url
}

export function clearAdhans(): void {
  urlCache.clear()
}