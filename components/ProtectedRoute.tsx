import React, { ReactNode } from 'react';
import { useWallet } from '../context/WalletContext';
import { Shield, AlertTriangle, Sparkles, Wallet, Network } from 'lucide-react';
import { config } from '../lib/wagmi';

interface ProtectedRouteProps {
  children: ReactNode;
  required?: boolean; // Whether wallet connection is required (default: true)
}

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}

// Type guard for error objects
interface ErrorWithCode {
  code?: number;
}

const isErrorWithCode = (error: unknown): error is ErrorWithCode => {
  return typeof error === 'object' && error !== null && 'code' in error;
};

// Helper function to get supported chains from wagmi config
const getSupportedChains = (): typeof config.chains => {
  return config.chains;
};

// Helper function to format chain ID for wallet requests
const formatChainId = (chainId: number): string => {
  return '0x' + chainId.toString(16);
};

// Helper function to get chain metadata for wallet_addEthereumChain
const getChainMetadata = (chainId: number) => {
  const chain = config.chains.find(c => c.id === chainId);
  if (!chain) return null;

  return {
    chainId: formatChainId(chain.id),
    chainName: chain.name,
    nativeCurrency: {
      name: chain.nativeCurrency?.name || 'ETH',
      symbol: chain.nativeCurrency?.symbol || 'ETH',
      decimals: chain.nativeCurrency?.decimals || 18
    },
    rpcUrls: chain.rpcUrls.default?.http || [],
    blockExplorerUrls: chain.blockExplorers?.default?.url ? [chain.blockExplorers.default.url] : []
  };
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  required = true
}): React.ReactElement => {
  const { isConnected, isConnecting, connectionError, isSupportedChain, chainName, connectWallet } = useWallet();
  const [hasMounted, setHasMounted] = React.useState(false);

  // Mark component as mounted on client side only
  React.useEffect(() => {
    setHasMounted(true);
  }, []);

  // During SSR and initial client render, return loading screen to prevent hydration mismatch
  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 mx-auto bg-linear-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 bg-linear-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading</h2>
            <p className="text-slate-400">Initializing courtroom...</p>
          </div>
        </div>
      </div>
    );
  }

  // If connection is not required, render children directly
  if (!required) {
    return <>{children}</>;
  }

  // Show loading state while connecting
  if (isConnecting) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 mx-auto bg-linear-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 bg-linear-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Connecting Wallet</h2>
            <p className="text-slate-400">Please wait while we connect to your wallet...</p>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div className="bg-linear-to-r from-cyan-500 to-purple-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  // Show connection error
  if (connectionError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div className="absolute inset-0 w-16 h-16 bg-red-500/10 rounded-full blur-xl" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-slate-400 mb-6">{connectionError}</p>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-linear-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-red-400 hover:to-red-500 transition-all duration-300"
            >
              Try Again
            </button>
            <button
              onClick={() => window.open('https://metamask.io/download.html', '_blank')}
              className="w-full border border-slate-600 text-slate-300 py-3 px-4 rounded-lg hover:border-slate-500 hover:text-white transition-all duration-300"
            >
              Install MetaMask
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show unsupported chain warning
  if (isConnected && !isSupportedChain) {
    const supportedChains = getSupportedChains();
    
    const handleSwitchToChain = (chainId: number): void => {
      if (!window.ethereum) return;

      const chainMetadata = getChainMetadata(chainId);
      if (!chainMetadata) return;

      window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainMetadata.chainId }],
      }).catch((error: unknown) => {
        if (isErrorWithCode(error) && error.code === 4902) {
          // Chain not added, try to add it
          window.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [chainMetadata]
          }).catch((addError: unknown) => {
            console.error(`Failed to add ${chainMetadata.chainName} network:`, addError);
          });
        } else {
          console.error('Failed to switch network:', error);
        }
      });
    };

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 bg-slate-900 border border-yellow-500/30 rounded-2xl p-8 text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center">
              <Network className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="absolute inset-0 w-16 h-16 bg-yellow-500/10 rounded-full blur-xl" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Unsupported Network</h2>
          <p className="text-slate-400 mb-4">You're connected to {chainName}</p>
          <p className="text-slate-500 text-sm mb-6">
            Please switch to one of the supported networks to access the courtroom.
          </p>

          <div className="space-y-3">
            {supportedChains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => handleSwitchToChain(chain.id)}
                className="w-full bg-linear-to-r from-yellow-500 to-yellow-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-yellow-400 hover:to-yellow-500 transition-all duration-300"
              >
                Switch to {chain.name}
              </button>
            ))}
            <button
              onClick={() => window.location.reload()}
              className="w-full border border-slate-600 text-slate-300 py-3 px-4 rounded-lg hover:border-slate-500 hover:text-white transition-all duration-300"
            >
              Check Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show wallet connection required
  if (!isConnected) {
    const handleConnectWallet = (): void => {
      // Trigger wallet connection through context
      connectWallet();
    };

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="max-w-md w-full mx-4 bg-slate-900 border border-cyan-500/30 rounded-2xl p-8 text-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 mx-auto bg-linear-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="absolute inset-0 w-16 h-16 bg-linear-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-50" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Wallet Required</h2>
          <p className="text-slate-400 mb-6">
            Connect your wallet to access the AI courtroom simulator and experience
            blockchain-powered legal battles.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleConnectWallet}
              className="w-full bg-linear-to-r from-cyan-500 via-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg
              font-semibold hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 transition-all duration-300 transform
              hover:scale-105 shadow-lg shadow-purple-500/50"
            >
              <div className="flex items-center justify-center gap-2">
                <Wallet className="w-5 h-5" />
                Connect Wallet
              </div>
            </button>
            <div className="text-xs text-slate-500">
              Supports MetaMask and other Web3 wallets
            </div>
          </div>

          <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <h3 className="text-sm font-semibold text-cyan-400 mb-2">Why Connect?</h3>
            <ul className="text-xs text-slate-400 space-y-1 text-left">
              <li>• Secure blockchain-based case records</li>
              <li>• AI-powered legal simulation</li>
              <li>• Immutable verdict storage</li>
              <li>• Transparent courtroom proceedings</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default ProtectedRoute;