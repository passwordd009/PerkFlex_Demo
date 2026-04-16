'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'

interface FileDropzoneProps {
  onParsed: (rows: Record<string, string>[], headers: string[]) => void
}

export function FileDropzone({ onParsed }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function parseFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a .csv file')
      return
    }
    setError(null)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? []
        if (headers.length === 0) {
          setError('CSV has no columns')
          return
        }
        onParsed(results.data, headers)
      },
      error(err) {
        setError(`Parse error: ${err.message}`)
      },
    })
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) parseFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={[
        'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-colors cursor-pointer',
        isDragging ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50',
      ].join(' ')}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleChange}
      />
      <Upload className="h-8 w-8 text-gray-400" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">Drop your CSV here</p>
        <p className="text-xs text-gray-400 mt-1">or click to browse</p>
      </div>
      <Button type="button" size="sm" variant="ghost" className="pointer-events-none">
        Choose file
      </Button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  )
}
