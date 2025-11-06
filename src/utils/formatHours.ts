export function formatHours(decimalHours: number): string {
  if (!decimalHours || decimalHours === 0) return '-'
  const totalMinutes = Math.floor(decimalHours * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

export function parseDate(dateString: string): Date {
  return new Date(dateString)
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

