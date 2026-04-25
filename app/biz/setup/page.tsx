'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createBusiness } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Store } from 'lucide-react'

const CATEGORIES = ['Restaurant', 'Cafe', 'Bar', 'Retail', 'Salon', 'Gym', 'Bakery', 'Other']

export default function BusinessSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      await createBusiness(new FormData(e.currentTarget))
    } catch (err: any) {
      toast.error(err.message || 'Failed to create business')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4">
            <Store className="text-white h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Set Up Your Business</h1>
          <p className="text-gray-500 text-sm mt-1">Tell us about your business to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Business Name <span className="text-red-500">*</span>
            </label>
            <Input name="name" placeholder="My Coffee Shop" required />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
            <select
              name="category"
              defaultValue="Other"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
            <Input name="description" placeholder="A short description of your business" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
            <Input name="address" placeholder="123 Main St, City" />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Creating…' : 'Create Business'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
