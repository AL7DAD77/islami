'use client'

import { PageHeader } from '@/components/page-header'
import { TasbihCounter } from '@/components/tasbih/tasbih-counter' // المسار الصحيح بناءً على صورتك

export default function TasbihPage() {
  return (
    <div className="pb-24">
      <PageHeader 
        title="المسبحة الإلكترونية" 
        subtitle="سبح بحمد ربك"
        backHref="/adhkar"
      />
      <div className="p-4">
        <TasbihCounter />
      </div>
    </div>
  )
}