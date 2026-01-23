import type { Metadata } from 'next'
import './globals.css'
import WagmiProviderWrapper from './components/WagmiProviderWrapper'

export const metadata: Metadata = {
  title: 'Rumble Court',
  description: 'AI-Driven Courtroom Simulator',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <WagmiProviderWrapper>
          {children}
        </WagmiProviderWrapper>
      </body>
    </html>
  )
}
