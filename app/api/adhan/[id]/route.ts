import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const url = `https://cdn.aladhan.com/audio/adhans/${id}.mp3`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      return new NextResponse('Not found', { status: 404 })
    }

    const blob = await res.blob()
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Error', { status: 500 })
  }
}