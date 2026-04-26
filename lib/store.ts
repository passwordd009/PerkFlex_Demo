import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cart, InventoryItem } from '@/types'
import { calcPointsDiscount } from '@/lib/utils'

interface CartStore extends Cart {
  addItem: (item: InventoryItem, businessId: string, districtId: string | null) => void
  removeItem: (inventoryItemId: string) => void
  updateQuantity: (inventoryItemId: string, quantity: number) => void
  applyReward: (rewardId: string) => void
  clearReward: () => void
  clearCart: () => void
  total: () => number
  discountedTotal: (pointsCost: number) => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      businessId: null,
      districtId: null,
      appliedRewardId: null,

      addItem(item, businessId, districtId) {
        const { items, businessId: currentBiz } = get()
        if (currentBiz && currentBiz !== businessId) {
          set({ items: [{ item, quantity: 1 }], businessId, districtId, appliedRewardId: null })
          return
        }
        const existing = items.find(i => i.item.id === item.id)
        if (existing) {
          set({
            items: items.map(i =>
              i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
            businessId,
            districtId,
          })
        } else {
          set({ items: [...items, { item, quantity: 1 }], businessId, districtId })
        }
      },

      removeItem(inventoryItemId) {
        set(s => ({ items: s.items.filter(i => i.item.id !== inventoryItemId) }))
      },

      updateQuantity(inventoryItemId, quantity) {
        if (quantity <= 0) {
          get().removeItem(inventoryItemId)
          return
        }
        set(s => ({
          items: s.items.map(i =>
            i.item.id === inventoryItemId ? { ...i, quantity } : i
          ),
        }))
      },

      applyReward(rewardId) {
        set({ appliedRewardId: rewardId })
      },

      clearReward() {
        set({ appliedRewardId: null })
      },

      clearCart() {
        set({ items: [], businessId: null, districtId: null, appliedRewardId: null })
      },

      total() {
        return get().items.reduce((sum, i) => sum + i.item.price * i.quantity, 0)
      },

      discountedTotal(pointsCost: number) {
        const discount = calcPointsDiscount(pointsCost)
        return Math.max(0, get().total() - discount)
      },
    }),
    { name: 'perkflex-cart' }
  )
)
