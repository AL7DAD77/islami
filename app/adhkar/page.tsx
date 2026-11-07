import type { Metadata } from 'next'
import { AdhkarMain } from '@/components/adhkar/adhkar-main'

export const metadata: Metadata = { title: 'الأذكار والأدعية | إسلامي' }

export default function AdhkarPage() {
  return <AdhkarMain />
}