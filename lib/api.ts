import { createClient } from '@/lib/supabase/client'
import type {
  CreateOrderRequest, CreateOrderResponse, VerifyQRResponse,
  InventoryUploadItem, InventoryUploadResponse, InventoryItem,
  CreateDiscountRequest, CreateDiscountResponse, Discount,
} from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_EXPRESS_API_URL || 'http://localhost:3001'

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return { Authorization: `Bearer ${session.access_token}` }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const authHeader = await getAuthHeader()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...(init.headers as Record<string, string> | undefined),
    },
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || `API error ${res.status}`)
  }
  return res.json() as Promise<T>
}

// Orders
export const ordersApi = {
  create: (data: CreateOrderRequest) =>
    apiFetch<CreateOrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (orderId: string) =>
    apiFetch<{ order: import('@/types').Order }>(`/orders/${orderId}`),

  list: () =>
    apiFetch<{ orders: import('@/types').Order[] }>('/orders'),
}

// QR Verification (business owner only)
export const verifyApi = {
  scan: (token: string) =>
    apiFetch<VerifyQRResponse>(`/verify/${encodeURIComponent(token)}`, {
      method: 'POST',
    }),
}

// Points
export const pointsApi = {
  balance: () =>
    apiFetch<{ balance: number; history: import('@/types').PointsLedgerEntry[] }>('/points/balance'),
  redeem: (rewardId: string, orderId?: string) =>
    apiFetch<{ success: boolean; pointsSpent: number }>('/points/redeem', {
      method: 'POST',
      body: JSON.stringify({ rewardId, orderId }),
    }),
}

// Account
export const accountApi = {
  delete: () => apiFetch<{ success: boolean }>('/account', { method: 'DELETE' }),
}

// Rewards
export const rewardsApi = {
  list: (businessId?: string) =>
    apiFetch<{ rewards: import('@/types').Reward[] }>(
      businessId ? `/rewards?businessId=${businessId}` : '/rewards'
    ),
}

// Inventory
export const inventoryApi = {
  list: () => apiFetch<InventoryItem[]>('/inventory'),
  upload: (items: InventoryUploadItem[]) =>
    apiFetch<InventoryUploadResponse>('/inventory/upload', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
}

// Discounts
export const discountsApi = {
  create: (data: CreateDiscountRequest) =>
    apiFetch<CreateDiscountResponse>('/discounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  list: () => apiFetch<Discount[]>('/discounts'),
}
