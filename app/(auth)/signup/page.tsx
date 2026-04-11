'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { User, Store } from 'lucide-react'

type Role = 'customer' | 'business_owner'

export default function SignupPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('customer')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    toast.success('Account created! You can now sign in.')
    router.push('/')
    router.refresh()
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
            <span className="text-white text-2xl font-black">P</span>
          </div>
          <h1 className="text-2xl font-black text-foreground">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join your local community</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {([['customer', 'Customer', User], ['business_owner', 'Business', Store]] as [Role, string, React.ElementType][]).map(
            ([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl p-4 border-2 transition-all',
                  role === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-gray-500'
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-semibold">{label}</span>
              </button>
            )
          )}
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              {role === 'business_owner' ? 'Business Name' : 'Full Name'}
            </label>
            <Input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder={role === 'business_owner' ? 'My Coffee Shop' : 'Jane Smith'}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
