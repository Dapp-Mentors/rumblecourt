"use client";

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '../lib/wagmi'
import { WalletProvider } from '../context/WalletContext';
import Header from './Header'

const queryClient = new QueryClient()

export default function WagmiProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <WalletProvider>
          <Header />
          {children}
          
        </WalletProvider>
      </WagmiProvider>
    </QueryClientProvider>
  )
}