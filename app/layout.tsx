import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'PerkFlex — Local Rewards',
  description: 'Preorder from local businesses and earn loyalty rewards',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
