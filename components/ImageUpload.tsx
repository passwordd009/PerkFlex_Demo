'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadImage } from '@/lib/upload'
import { toast } from 'sonner'

interface Props {
  value: string | null
  bucket: string
  path: string
  onUpload: (url: string) => void
  onClear?: () => void
  aspectRatio?: 'square' | 'wide'
  placeholder?: string
}

export function ImageUpload({
  value,
  bucket,
  path,
  onUpload,
  onClear,
  aspectRatio = 'square',
  placeholder = 'Upload image',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show a local preview immediately so the user sees something right away
    const localUrl = URL.createObjectURL(file)
    onUpload(localUrl)

    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const fullPath = `${path}.${ext}`
      const url = await uploadImage(supabase, bucket, fullPath, file)
      URL.revokeObjectURL(localUrl)
      onUpload(url)
    } catch (err) {
      URL.revokeObjectURL(localUrl)
      onClear?.()
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const heightClass = aspectRatio === 'wide' ? 'h-32' : 'h-36'

  return (
    <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50`}>
      {value ? (
        <>
          <img src={value} alt="Uploaded" className="w-full h-full object-cover" />

          {/* Upload spinner overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}

          {!uploading && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-2 right-2 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-lg hover:bg-black/70 transition-colors"
            >
              Change
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary hover:border-primary transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <ImagePlus className="h-6 w-6" />
          )}
          <span className="text-xs font-medium">{uploading ? 'Uploading…' : placeholder}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}
