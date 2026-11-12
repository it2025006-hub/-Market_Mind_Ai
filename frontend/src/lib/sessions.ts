function partsInZone(timeZone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  const hour = Number(read('hour'))
  const minute = Number(read('minute'))
  return {
    weekday: read('weekday'),
    minutes: hour * 60 + minute,
  }
}

function isOpen(timeZone: string, openMin: number, closeMin: number) {
  const { weekday, minutes } = partsInZone(timeZone)
  if (weekday === 'Sat' || weekday === 'Sun') return false
  return minutes >= openMin && minutes <= closeMin
}

export function marketSessions(date = new Date()) {
  return [
    {
      id: 'NSE',
      label: 'NSE cash',
      open: isOpen('Asia/Kolkata', 9 * 60 + 15, 15 * 60 + 30),
      hours: '09:15–15:30 IST',
    },
    {
      id: 'NYSE',
      label: 'NYSE cash',
      open: isOpen('America/New_York', 9 * 60 + 30, 16 * 60),
      hours: '09:30–16:00 ET',
    },
  ].map((session) => ({
    ...session,
    asOf: date.toISOString(),
  }))
}
