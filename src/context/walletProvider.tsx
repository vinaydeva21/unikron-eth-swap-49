
import { useState, useEffect } from 'react';
import { WalletContext } from './walletContext';
import { WalletProvider } from '@/config/wallets';
import { ethers } from 'ethers';
import { toast } from 'sonner';

export const WalletContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [cardanoAPI, setCardanoAPI] = useState<any>(null);

  useEffect(() => {
    // Check if we already have a wallet connection from localStorage
    const savedWallet = localStorage.getItem('selectedWallet');
    if (savedWallet) {
      const wallet = JSON.parse(savedWallet);
      reconnectWallet(wallet);
    }
    
    // Listen for account changes in Ethereum wallets
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
      if (wallet.isCardano) {
        await reconnectCardanoWallet(wallet);
      } else if (window.ethereum) {
        // For Ethereum wallets
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

  const reconnectCardanoWallet = async (wallet: WalletProvider) => {
    try {
      if (wallet.id === 'nami' && (window as any).cardano?.nami) {
        const api = await (window as any).cardano.nami.enable();
        const addresses = await api.getUsedAddresses();
        if (addresses && addresses.length > 0) {
          // Convert the Cardano address bytes to string
          const addressHex = addresses[0];
          const addressStr = Buffer.from(addressHex, 'hex').toString();
          setAddress(addressStr);
          setIsConnected(true);
          setSelectedWallet(wallet);
          setCardanoAPI(api);
        }
      } else if (wallet.id === 'yoroi' && (window as any).cardano?.yoroi) {
        const api = await (window as any).cardano.yoroi.enable();
        const addresses = await api.getUsedAddresses();
        if (addresses && addresses.length > 0) {
          const addressHex = addresses[0];
          const addressStr = Buffer.from(addressHex, 'hex').toString();
          setAddress(addressStr);
          setIsConnected(true);
          setSelectedWallet(wallet);
          setCardanoAPI(api);
        }
      }
    } catch (error) {
      console.error('Error reconnecting Cardano wallet:', error);
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
      // For RainbowKit wallets
      if (wallet.isRainbowKit) {
        // RainbowKit is handled by the RainbowKit UI
        setSelectedWallet(wallet);
        return;
      }
      
      // For Cardano wallets
      if (wallet.isCardano) {
        await connectCardanoWallet(wallet);
        return;
      }
      
      // For MetaMask and other EVM wallets
      if (!window.ethereum) {
        toast.error(`${wallet.name} wallet not detected. Please install it first.`);
        return;
      }
      
      // Request account access for Ethereum wallets
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        setSelectedWallet(wallet);
        
        // Save wallet selection to localStorage
        localStorage.setItem('selectedWallet', JSON.stringify(wallet));
        
        toast.success(`Connected to ${wallet.name}`);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(`Failed to connect: ${(error as Error).message}`);
    }
  };

  const connectCardanoWallet = async (wallet: WalletProvider) => {
    try {
      if (wallet.id === 'nami') {
        if (!(window as any).cardano?.nami) {
          window.open('https://namiwallet.io/', '_blank');
          toast.info(`Please install ${wallet.name} to continue`);
          return;
        }
        
        const api = await (window as any).cardano.nami.enable();
        if (api) {
          const addresses = await api.getUsedAddresses();
          if (addresses && addresses.length > 0) {
            // Convert the Cardano address bytes to string
            const addressHex = addresses[0];
            const addressStr = Buffer.from(addressHex, 'hex').toString();
            
            setAddress(addressStr);
            setIsConnected(true);
            setSelectedWallet(wallet);
            setCardanoAPI(api);
            
            // Save wallet selection to localStorage
            localStorage.setItem('selectedWallet', JSON.stringify(wallet));
            
            toast.success(`Connected to ${wallet.name}`);
          }
        }
      } else if (wallet.id === 'yoroi') {
        if (!(window as any).cardano?.yoroi) {
          window.open('https://yoroi-wallet.com/', '_blank');
          toast.info(`Please install ${wallet.name} to continue`);
          return;
        }
        
        const api = await (window as any).cardano.yoroi.enable();
        if (api) {
          const addresses = await api.getUsedAddresses();
          if (addresses && addresses.length > 0) {
            // Convert the Cardano address bytes to string
            const addressHex = addresses[0];
            const addressStr = Buffer.from(addressHex, 'hex').toString();
            
            setAddress(addressStr);
            setIsConnected(true);
            setSelectedWallet(wallet);
            setCardanoAPI(api);
            
            // Save wallet selection to localStorage
            localStorage.setItem('selectedWallet', JSON.stringify(wallet));
            
            toast.success(`Connected to ${wallet.name}`);
          }
        }
      }
    } catch (error) {
      console.error('Error connecting Cardano wallet:', error);
      toast.error(`Failed to connect to ${wallet.name}: ${(error as Error).message}`);
    }
  };

  const disconnect = async () => {
    setIsConnected(false);
    setSelectedWallet(null);
    setAddress(null);
    setCardanoAPI(null);
    
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
        walletAddress: address, // Add walletAddress as an alias to address
        connect,
        disconnect
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
