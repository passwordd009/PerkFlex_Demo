'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/upload'
import { ImageUpload } from '@/components/ImageUpload'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Business } from '@/types'

export default function BusinessSettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()
      if (data) {
        setBusiness(data)
        setLogoUrl(data.logo_url)
        setCoverUrl(data.cover_url)
        setName(data.name)
        setDescription(data.description ?? '')
      }
    }
    load()
  }, [])

  async function handleSave() {
    if (!business) return
    setIsPending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('businesses')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          logo_url: logoUrl,
          cover_url: coverUrl,
        })
        .eq('id', business.id)
      if (error) throw error
      toast.success('Settings saved')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsPending(false)
    }
  }

  if (!business) {
    return (
      <div className="px-4 pt-12 pb-6">
        <p className="text-center text-gray-400 text-sm py-16">Loading…</p>
      </div>
    )
  }

  return (
    <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-foreground mb-6">Business Settings</h1>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Cover Photo</label>
          <ImageUpload
            value={coverUrl}
            bucket="ember"
            path={`business/${business.id}/cover`}
            onUpload={setCoverUrl}
            onClear={() => setCoverUrl(null)}
            aspectRatio="wide"
            placeholder="Upload cover photo"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Logo</label>
          <ImageUpload
            value={logoUrl}
            bucket="ember"
            path={`business/${business.id}/logo`}
            onUpload={setLogoUrl}
            onClear={() => setLogoUrl(null)}
            placeholder="Upload logo"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Business Name</label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Business name"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Description</label>
          <Input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Short description (optional)"
          />
        </div>

        <Button className="w-full" onClick={handleSave} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
