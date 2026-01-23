"use client";

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '../lib/wagmi'
import Header from './Header'
import Footer from './Footer';

const queryClient = new QueryClient()

export default function WagmiProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <Header />
        {children}
        <Footer />
      </WagmiProvider>
    </QueryClientProvider>
  )
}
