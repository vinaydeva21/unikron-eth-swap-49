
import { useState, useEffect } from 'react';
import { WalletContext } from './walletContext';
import { WalletProvider } from '@/config/wallets';
import { ethers } from 'ethers';
import { toast } from 'sonner';

export const WalletContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    // Check if we already have a wallet connection from localStorage
    const savedWallet = localStorage.getItem('selectedWallet');
    if (savedWallet) {
      const wallet = JSON.parse(savedWallet);
      reconnectWallet(wallet);
    }
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);
  
  const reconnectWallet = async (wallet: WalletProvider) => {
    try {
      // Attempt to get accounts to check if we're already connected
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          setSelectedWallet(wallet);
        }
      }
    } catch (error) {
      console.error('Error reconnecting wallet:', error);
    }
  };
  
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnect();
    } else {
      // Account changed, update the address
      setAddress(accounts[0]);
    }
  };

  const connect = async (wallet: WalletProvider) => {
    try {
      // For non-Rain bow Kit wallets
      if (!wallet.isRainbowKit) {
        if (!window.ethereum) {
          toast.error(`${wallet.name} wallet not detected. Please install it first.`);
          return;
        }
        
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          setSelectedWallet(wallet);
          
          // Save wallet selection to localStorage
          localStorage.setItem('selectedWallet', JSON.stringify(wallet));
          
          toast.success(`Connected to ${wallet.name}`);
        }
      } else {
        // RainbowKit wallets are handled by the RainbowKit UI
        // But we still set the selectedWallet
        setSelectedWallet(wallet);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(`Failed to connect: ${(error as Error).message}`);
    }
  };

  const disconnect = async () => {
    setIsConnected(false);
    setSelectedWallet(null);
    setAddress(null);
    
    // Remove saved wallet from localStorage
    localStorage.removeItem('selectedWallet');
    
    toast.info('Wallet disconnected');
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        selectedWallet,
        address,
        connect,
        disconnect
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
