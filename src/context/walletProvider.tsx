
import { useState, useEffect, ReactNode } from 'react';
import WalletContext from './walletContext';
import { WALLET_PROVIDERS, WalletProvider } from '@/config/wallets';
import { toast } from 'sonner';

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletProvider | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    // Check if wallet was previously connected
    const checkPreviousConnection = async () => {
      const savedWalletId = localStorage.getItem('selectedWallet');
      if (savedWalletId) {
        const wallet = WALLET_PROVIDERS.find(w => w.id === savedWalletId);
        if (wallet) {
          try {
            const connected = await connectWallet(wallet);
            if (!connected) {
              localStorage.removeItem('selectedWallet');
            }
          } catch (error) {
            console.error("Error reconnecting wallet:", error);
            localStorage.removeItem('selectedWallet');
          }
        }
      }
    };
    
    checkPreviousConnection();
  }, []);

  const connectWallet = async (wallet: WalletProvider): Promise<boolean> => {
    try {
      if (wallet.isRainbowKit) {
        // RainbowKit will handle connection on its own UI
        return true;
      }
      
      let address = null;
      
      switch (wallet.id) {
        case 'metamask':
          if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts && accounts.length > 0) {
              setIsConnected(true);
              setSelectedWallet(wallet);
              setWalletAddress(accounts[0]);
              address = accounts[0];
              localStorage.setItem('selectedWallet', wallet.id);
              toast.success(`Connected to ${wallet.name}`);
              return true;
            }
          } else {
            window.open('https://metamask.io/download/', '_blank');
            toast.info(`Please install ${wallet.name} to continue`);
          }
          break;
          
        case 'nami':
          if (window.cardano?.nami) {
            const api = await window.cardano.nami.enable();
            if (api) {
              setIsConnected(true);
              setSelectedWallet(wallet);
              // Cardano wallets don't expose address directly, we'd need to use API
              localStorage.setItem('selectedWallet', wallet.id);
              toast.success(`Connected to ${wallet.name}`);
              return true;
            }
          } else {
            window.open('https://namiwallet.io/', '_blank');
            toast.info(`Please install ${wallet.name} to continue`);
          }
          break;
          
        case 'yoroi':
          if (window.cardano?.yoroi) {
            const api = await window.cardano.yoroi.enable();
            if (api) {
              setIsConnected(true);
              setSelectedWallet(wallet);
              localStorage.setItem('selectedWallet', wallet.id);
              toast.success(`Connected to ${wallet.name}`);
              return true;
            }
          } else {
            window.open('https://yoroi-wallet.com/', '_blank');
            toast.info(`Please install ${wallet.name} to continue`);
          }
          break;
          
        case 'walletconnect':
          setIsConnected(true);
          setSelectedWallet(wallet);
          localStorage.setItem('selectedWallet', wallet.id);
          toast.success(`Connected to ${wallet.name}`);
          return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(`Failed to connect to ${wallet.name}`);
      return false;
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setSelectedWallet(null);
    setWalletAddress(null);
    localStorage.removeItem('selectedWallet');
    toast.info('Wallet disconnected');
  };

  return (
    <WalletContext.Provider 
      value={{ 
        isConnected, 
        selectedWallet, 
        connect: connectWallet, 
        disconnect,
        walletAddress
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
