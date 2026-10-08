import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { QiblaCompass } from '@/components/qibla-compass'

export const metadata: Metadata = { title: 'اتجاه القبلة | نور' }

export default function QiblaPage() {
  return (
    <>
      <PageHeader title="اتجاه القبلة" subtitle="بوصلة دقيقة حسب موقعك" backHref="/more" />
      <QiblaCompass />
    </>
  )
}
