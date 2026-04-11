import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function formatPoints(points: number): string {
  return points.toLocaleString()
}

/** 10 pts per $1 */
export const POINTS_PER_DOLLAR = 10

/** 100 pts = $1 discount */
export const POINTS_TO_DOLLAR = 100

export function calcPointsEarned(total: number): number {
  return Math.floor(total * POINTS_PER_DOLLAR)
}

export function calcPointsDiscount(points: number): number {
  return points / POINTS_TO_DOLLAR
}

export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
