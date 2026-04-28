// ─── User / Auth ────────────────────────────────────────────────────────────

export type UserRole = 'customer' | 'business_owner'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  points_balance: number
  created_at: string
}

// ─── Districts ───────────────────────────────────────────────────────────────

export interface District {
  id: string
  name: string
  created_at: string
}

// ─── Businesses ──────────────────────────────────────────────────────────────

export interface Business {
  id: string
  owner_id: string
  district_id: string | null
  name: string
  description: string | null
  category: string | null
  address: string | null
  lat: number | null
  lng: number | null
  logo_url: string | null
  cover_url: string | null
  is_active: boolean
  created_at: string
  // joined
  district?: District
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled'

export interface Order {
  id: string
  customer_id: string
  business_id: string
  status: OrderStatus
  total: number
  points_earned: number
  points_redeemed: number
  qr_token: string | null
  notes: string | null
  created_at: string
  verified_at: string | null
  // joined
  business?: Business
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  inventory_item_id: string | null
  menu_item_id: string | null
  item_name: string | null
  quantity: number
  unit_price: number
  subtotal: number
}

// ─── Points ──────────────────────────────────────────────────────────────────

export type PointsType = 'earned' | 'redeemed' | 'expired' | 'bonus'

export interface PointsLedgerEntry {
  id: string
  user_id: string
  order_id: string | null
  type: PointsType
  amount: number
  description: string | null
  created_at: string
}

// ─── Rewards ─────────────────────────────────────────────────────────────────

export type DiscountType = 'fixed' | 'percentage'

export interface Reward {
  id: string
  business_id: string
  menu_item_id: string | null
  name: string
  description: string | null
  points_cost: number
  discount_amount: number | null
  discount_type: DiscountType | null
  is_active: boolean
  expires_at: string | null
  created_at: string
  // joined
  business?: Business
}

export interface RewardRedemption {
  id: string
  user_id: string
  reward_id: string
  order_id: string | null
  points_spent: number
  created_at: string
  reward?: Reward
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  item: InventoryItem
  quantity: number
}

export interface Cart {
  items: CartItem[]
  businessId: string | null
  districtId: string | null
  appliedRewardId: string | null
  appliedDiscountId: string | null
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string
  name: string
  price: number
  quantity: number
  category: string
  business_id: string
  image_url: string | null
  created_at: string
}

export interface InventoryUploadItem {
  name: string
  price: number
  quantity: number
  category: string
}

export interface InventoryUploadResponse {
  success_count: number
  error_count: number
  errors: Array<{ row: number; message: string }>
}

export type RequiredField = 'name' | 'price' | 'quantity' | 'category'
export type ColumnMapping = Record<RequiredField, string | null>

// ─── Discounts ────────────────────────────────────────────────────────────────

export interface Discount {
  id: string
  business_id: string
  title: string
  description: string | null
  image_url: string | null
  discount_percentage: number
  points_cost: number
  item_ids: string[]
  is_combo: boolean
  created_at: string
}

export interface CreateDiscountRequest {
  title: string
  description?: string
  image_url?: string
  discount_percentage: number
  item_ids: string[]
}

export interface CreateDiscountResponse {
  id: string
}

// ─── API responses ───────────────────────────────────────────────────────────

export interface CreateOrderRequest {
  businessId: string
  items: { inventoryItemId: string; quantity: number }[]
  notes?: string
  rewardId?: string
  discountId?: string
  customerLat?: number
  customerLng?: number
}

export interface CreateOrderResponse {
  orderId: string
  qrToken: string
  total: number
  pointsEarned: number
  pointsRedeemed: number
}

export interface VerifyQRResponse {
  success: boolean
  orderId: string
  customerId: string
  pointsAwarded: number
}
