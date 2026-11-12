export function formatNumber(value: number, digits = 2, locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatPrice(value: number, currency = 'USD') {
  const digits = Math.abs(value) >= 100 ? 2 : Math.abs(value) >= 1 ? 2 : 4
  return formatNumber(value, digits, currency === 'INR' ? 'en-IN' : 'en-US')
}

export function currencySymbol(currency: string) {
  if (currency === 'INR') return '₹'
  return '$'
}

export function money(value: number, currency = 'USD') {
  return `${currencySymbol(currency)}${formatPrice(value, currency)}`
}

export function formatPct(value: number, digits = 2) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatDateTime(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatDay(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(date)
}

export function signedClass(value: number) {
  if (value > 0) return 'text-bull'
  if (value < 0) return 'text-bear'
  return 'text-mute'
}

export function downloadText(filename: string, content: string, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function csvEscape(value: unknown) {
  const text = value == null ? '' : String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}
