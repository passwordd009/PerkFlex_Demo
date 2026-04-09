import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cart, CartItem, MenuItem } from '@/types'
import { calcPointsDiscount } from '@/lib/utils'

interface CartStore extends Cart {
  addItem: (item: MenuItem, businessId: string, districtId: string | null) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
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

      addItem(menuItem, businessId, districtId) {
        const { items, businessId: currentBiz } = get()
        // If switching business, clear cart first
        if (currentBiz && currentBiz !== businessId) {
          set({ items: [{ menuItem, quantity: 1 }], businessId, districtId, appliedRewardId: null })
          return
        }
        const existing = items.find(i => i.menuItem.id === menuItem.id)
        if (existing) {
          set({
            items: items.map(i =>
              i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
            businessId,
            districtId,
          })
        } else {
          set({ items: [...items, { menuItem, quantity: 1 }], businessId, districtId })
        }
      },

      removeItem(menuItemId) {
        set(s => ({ items: s.items.filter(i => i.menuItem.id !== menuItemId) }))
      },

      updateQuantity(menuItemId, quantity) {
        if (quantity <= 0) {
          get().removeItem(menuItemId)
          return
        }
        set(s => ({
          items: s.items.map(i =>
            i.menuItem.id === menuItemId ? { ...i, quantity } : i
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
        return get().items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0)
      },

      discountedTotal(pointsCost: number) {
        const discount = calcPointsDiscount(pointsCost)
        return Math.max(0, get().total() - discount)
      },
    }),
    { name: 'perkflex-cart' }
  )
)
