'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { accountApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { LogOut, Trash2 } from 'lucide-react'

export function AccountActions() {
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
      <div className="space-y-2 mt-6">
        <Button variant="outline" className="w-full" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
        <Button
          variant="ghost"
          className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" /> Delete Account
        </Button>
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
