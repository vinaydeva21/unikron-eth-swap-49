import { useState, useEffect } from 'react';
import { WalletContext } from './walletContext';
import { WalletProvider } from '@/config/wallets';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { useAccount, useConnect } from 'wagmi';
import { WALLET_PROVIDERS } from '@/config/wallets';

export const WalletContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [cardanoAPI, setCardanoAPI] = useState<any>(null);
  
  const { address: wagmiAddress, isConnected: isWagmiConnected } = useAccount();
  const { openConnectModal } = useConnect();

  useEffect(() => {
    if (isWagmiConnected && wagmiAddress) {
      const rainbowKitWallet = WALLET_PROVIDERS.find(w => w.isRainbowKit);
      if (rainbowKitWallet && (!isConnected || !selectedWallet?.isRainbowKit)) {
        setIsConnected(true);
        setSelectedWallet(rainbowKitWallet);
        setAddress(wagmiAddress);
        
        toast.success(`Connected to ${rainbowKitWallet.name}`);
      }
    } else if (!isWagmiConnected && selectedWallet?.isRainbowKit) {
      if (isConnected) {
        setIsConnected(false);
        setAddress(null);
      }
    }
    
    const savedWallet = localStorage.getItem('selectedWallet');
    if (savedWallet && !isWagmiConnected) {
      const wallet = JSON.parse(savedWallet);
      if (!wallet.isRainbowKit) {
        reconnectWallet(wallet);
      }
    }
    
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [isWagmiConnected, wagmiAddress]);

  const reconnectWallet = async (wallet: WalletProvider) => {
    try {
      if (wallet.isCardano) {
        await reconnectCardanoWallet(wallet);
      } else if (window.ethereum) {
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
      disconnect();
    } else {
      setAddress(accounts[0]);
    }
  };

  const connect = async (wallet: WalletProvider) => {
    try {
      if (wallet.isRainbowKit) {
        setSelectedWallet(wallet);
        if (openConnectModal) {
          openConnectModal();
        } else {
          console.error("RainbowKit connect modal not available");
          toast.error("Unable to open wallet connection modal");
        }
        
        return;
      }
      
      if (wallet.isCardano) {
        await connectCardanoWallet(wallet);
        return;
      }
      
      if (!window.ethereum) {
        toast.error(`${wallet.name} wallet not detected. Please install it first.`);
        return;
      }
      
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        setSelectedWallet(wallet);
        
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
            const addressHex = addresses[0];
            const addressStr = Buffer.from(addressHex, 'hex').toString();
            
            setAddress(addressStr);
            setIsConnected(true);
            setSelectedWallet(wallet);
            setCardanoAPI(api);
            
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
            const addressHex = addresses[0];
            const addressStr = Buffer.from(addressHex, 'hex').toString();
            
            setAddress(addressStr);
            setIsConnected(true);
            setSelectedWallet(wallet);
            setCardanoAPI(api);
            
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
    
    localStorage.removeItem('selectedWallet');
    
    toast.info('Wallet disconnected');
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        selectedWallet,
        address,
        walletAddress: address,
        connect,
        disconnect
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
