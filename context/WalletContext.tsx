import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { config } from '../lib/wagmi';

interface WalletContextType {
  // Wallet state
  address: string | undefined;
  isConnected: boolean;
  chainId: number;
  displayAddress: string;
  chainName: string;
  
  // Wallet actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  
  // Connection status
  isConnecting: boolean;
  connectionError: string | null;
  
  // Utility functions
  isSupportedChain: boolean;
  getChainName: (chainId: number) => string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Get display address
  const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  // Get chain name
  const getChainName = (chainId: number): string => {
    const chain = config.chains.find(c => c.id === chainId);
    return chain?.name || 'Unknown Network';
  };

  const chainName = getChainName(chainId);

  // Check if current chain is supported
  const isSupportedChain = config.chains.some(c => c.id === chainId);

  // Handle connection errors
  useEffect(() => {
    if (!connectError) return;
    // schedule state update asynchronously to avoid cascading renders
    const showErrorTimer = setTimeout(() => setConnectionError(connectError.message), 0);
    const clearErrorTimer = setTimeout(() => setConnectionError(null), 5000); // Clear error after 5 seconds
    return () => {
      clearTimeout(showErrorTimer);
      clearTimeout(clearErrorTimer);
    };
  }, [connectError]);

  const connectWallet = async () => {
    try {
      setConnectionError(null);
      // Use first available connector (MetaMask)
      if (connectors.length > 0) {
        await connect({ connector: connectors[0] });
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setConnectionError('Failed to connect wallet. Please try again.');
    }
  };

  const disconnectWallet = () => {
    try {
      disconnect();
      setConnectionError(null);
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
      setConnectionError('Failed to disconnect wallet.');
    }
  };

  const value: WalletContextType = {
    // Wallet state
    address,
    isConnected,
    chainId,
    displayAddress,
    chainName,
    
    // Wallet actions
    connectWallet,
    disconnectWallet,
    
    // Connection status
    isConnecting,
    connectionError,
    
    // Utility functions
    isSupportedChain,
    getChainName,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};