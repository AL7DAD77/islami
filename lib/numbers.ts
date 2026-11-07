import { useSettings } from '@/lib/settings'

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

export function toArabicNumber(value: number | string): string {
  const text = String(value)

  return text.replace(/[0-9]/g, (digit) => {
    return ARABIC_DIGITS[Number(digit)]
  })
}

export function formatNumber(
  value: number | string,
  format: 'arabic' | 'english',
): string {
  if (format === 'arabic') {
    return toArabicNumber(value)
  }

  return String(value)
}

export function useNumberFormat() {
  const [settings] = useSettings()

  const format = settings.numberFormat ?? 'arabic'

  const formatValue = (value: number | string) => {
    return formatNumber(value, format)
  }

  return {
    format,
    formatValue,
  }
}