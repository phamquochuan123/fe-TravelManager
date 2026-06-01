import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 0 }).format(amount) + ' VNĐ'
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

export function resolveBase64Image(data: string | null | undefined, fallback: string): string {
  if (!data) return fallback
  if (data.startsWith('http') || data.startsWith('data:')) return data
  if (data.startsWith('iVBORw')) return `data:image/png;base64,${data}`
  if (data.startsWith('R0lGOD')) return `data:image/gif;base64,${data}`
  if (data.startsWith('UklGR')) return `data:image/webp;base64,${data}`
  return `data:image/jpeg;base64,${data}`
}
