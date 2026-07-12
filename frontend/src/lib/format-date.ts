/**
 * Lightweight relative-time formatter using the built-in Intl API.
 * No external dependencies.
 */

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

type RelativeTimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'

const THRESHOLDS: { unit: RelativeTimeUnit; seconds: number }[] = [
  { unit: 'year', seconds: 60 * 60 * 24 * 365 },
  { unit: 'month', seconds: 60 * 60 * 24 * 30 },
  { unit: 'week', seconds: 60 * 60 * 24 * 7 },
  { unit: 'day', seconds: 60 * 60 * 24 },
  { unit: 'hour', seconds: 60 * 60 },
  { unit: 'minute', seconds: 60 },
  { unit: 'second', seconds: 1 },
]

/**
 * Returns a relative-time string like "2 days ago", "in 5 minutes", "just now".
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date)
  const diffSeconds = Math.round((d.getTime() - Date.now()) / 1000)
  const absSeconds = Math.abs(diffSeconds)

  for (const { unit, seconds } of THRESHOLDS) {
    if (absSeconds >= seconds) {
      return rtf.format(Math.round(diffSeconds / seconds), unit)
    }
  }

  return 'just now'
}

/**
 * Returns a short absolute date string, e.g. "Jul 12, 2026".
 */
export function formatDate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date)
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}
