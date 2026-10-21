// Calendar fields retain their literal day; timestamps use the local day.
// This is the same date interpretation used by the existing Dashboard/Calendar.
export function calendarDayKey(value) {
  if (!value) return null
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}
