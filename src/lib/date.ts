import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'

export function getMonthKey(date: Date): string {
  return format(date, 'yyyy-MM')
}

export function getMonthStart(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number)
  return startOfMonth(new Date(year!, month! - 1))
}

export function getMonthEnd(monthKey: string): Date {
  const [year, month] = monthKey.split('-').map(Number)
  return endOfMonth(new Date(year!, month! - 1))
}

export function getNextMonth(monthKey: string): string {
  const date = getMonthStart(monthKey)
  return getMonthKey(addMonths(date, 1))
}

export function getPrevMonth(monthKey: string): string {
  const date = getMonthStart(monthKey)
  return getMonthKey(subMonths(date, 1))
}

export function formatMonthYear(monthKey: string): string {
  const date = getMonthStart(monthKey)
  return format(date, 'MMMM yyyy')
}

export function formatDate(date: Date): string {
  return format(date, 'dd MMM yyyy')
}

export function formatIndianNumber(n: number): string {
  const s = Math.abs(Math.trunc(n)).toString()
  if (s.length <= 3) return s
  const last3 = s.slice(-3)
  const rest = s.slice(0, -3)
  const formatted = rest.replace(/(\d)(?=(\d{2})+$)/g, '$1,')
  return `${formatted},${last3}`
}

export function formatIndianAmount(n: number): string {
  const formatted = formatIndianNumber(n)
  const hasDecimal = n !== Math.trunc(n)
  if (hasDecimal) {
    const dec = Math.abs(n - Math.trunc(n)).toFixed(2).slice(2)
    return `${formatted}.${dec}`
  }
  return formatted
}
