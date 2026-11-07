import {
  CalculationMethod,
  CalculationParameters,
  Madhab,
} from 'adhan'

export type MethodKey =
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'Dubai'
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore'
  | 'Tehran'
  | 'Turkey'
  | 'NorthAmerica'
  | 'MoonsightingCommittee'
  | 'JordanAwqaf'
  | 'AlgeriaMinistry'
  | 'TunisiaMinistry'
  | 'MoroccoHabous'

export const METHOD_KEYS: MethodKey[] = [
  'MuslimWorldLeague',
  'Egyptian',
  'Karachi',
  'UmmAlQura',
  'Dubai',
  'Kuwait',
  'Qatar',
  'Singapore',
  'Tehran',
  'Turkey',
  'NorthAmerica',
  'MoonsightingCommittee',
  'JordanAwqaf',
  'AlgeriaMinistry',
  'TunisiaMinistry',
  'MoroccoHabous',
]

export function isMethodKey(value: unknown): value is MethodKey {
  return (
    typeof value === 'string' &&
    (METHOD_KEYS as string[]).includes(value)
  )
}

export function normalizeMethodKey(value: unknown): MethodKey {
  return isMethodKey(value) ? value : 'MuslimWorldLeague'
}

type CustomMethodKey =
  | 'JordanAwqaf'
  | 'AlgeriaMinistry'
  | 'TunisiaMinistry'
  | 'MoroccoHabous'

function isCustomMethod(method: MethodKey): method is CustomMethodKey {
  return (
    method === 'JordanAwqaf' ||
    method === 'AlgeriaMinistry' ||
    method === 'TunisiaMinistry' ||
    method === 'MoroccoHabous'
  )
}

/**
 * طرق وطنية غير موجودة في مكتبة adhan.
 *
 * هذه المعاملات مطابقة تماماً لـ lib/prayer.ts
 * حتى لا تختلف المواقيت بين الواجهة والحساب.
 */
function getCustomParams(method: CustomMethodKey): CalculationParameters {
  const parameters = CalculationMethod.Other()

  switch (method) {
    case 'JordanAwqaf':
      parameters.fajrAngle = 18
      parameters.ishaAngle = 18

      parameters.adjustments.dhuhr = 0
      parameters.adjustments.maghrib = 0

      break

    case 'AlgeriaMinistry':
      parameters.fajrAngle = 18
      parameters.ishaAngle = 17

      break

    case 'TunisiaMinistry':
      parameters.fajrAngle = 18
      parameters.ishaAngle = 18

      break

    case 'MoroccoHabous':
      parameters.fajrAngle = 19
      parameters.ishaAngle = 17

      parameters.adjustments.sunrise = -3
      parameters.adjustments.dhuhr = 5
      parameters.adjustments.maghrib = 5

      break
  }

  return parameters
}

export function getCalculationMethod(
  method: MethodKey,
): CalculationParameters {
  if (isCustomMethod(method)) {
    return getCustomParams(method)
  }

  const methodFactory =
    CalculationMethod[method as keyof typeof CalculationMethod]

  if (typeof methodFactory === 'function') {
    return methodFactory()
  }

  return CalculationMethod.UmmAlQura()
}

export function applyMadhab(
  parameters: CalculationParameters,
  madhab: 'shafi' | 'hanafi',
): CalculationParameters {
  parameters.madhab =
    madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi

  return parameters
}