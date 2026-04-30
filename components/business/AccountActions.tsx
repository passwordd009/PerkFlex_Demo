'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { accountApi } from '@/lib/api'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MoreVertical, LogOut, Trash2 } from 'lucide-react'

interface Props {
  businessName: string
  logoUrl: string | null
}

export function AccountActions({ businessName, logoUrl }: Props) {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function deleteAccount() {
    setIsDeleting(true)
    try {
      await accountApi.delete()
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete account')
    } finally {
      setIsDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between pt-12 pb-2 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/10 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-base font-black text-primary">{businessName[0]}</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide leading-none mb-0.5">Business</p>
            <p className="text-lg font-black text-foreground leading-tight">{businessName}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="h-4 w-4" /> Sign Out
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500 focus:text-red-600 focus:bg-red-50"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" /> Delete Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={confirmDelete} onOpenChange={open => { if (!open) setConfirmDelete(false) }}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Permanently delete your account and all associated data? This cannot be undone.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" disabled={isDeleting} onClick={deleteAccount}>
              {isDeleting ? 'Deleting…' : 'Delete Account'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
