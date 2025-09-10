import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/AuthContext'
import { UserModeProvider } from '@/lib/contexts/UserModeContext'
import ThemeInitializer from '@/components/common/ThemeInitializer'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'CognIA | Tu Campus Virtual con Inteligencia Artificial',
  description: 'Plataforma educativa avanzada que utiliza inteligencia artificial para personalizar el aprendizaje',
  icons: {
    icon: '/faviconcognia.jpeg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script
          src="/theme-handler.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeInitializer />
        <AuthProvider>
          <UserModeProvider>
            {children}
          </UserModeProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 