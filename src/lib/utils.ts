import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str
}

export function resolveBase64Image(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw
  try { return `data:image/jpeg;base64,${btoa(unescape(encodeURIComponent(raw)))}` }
  catch { return fallback }
}
