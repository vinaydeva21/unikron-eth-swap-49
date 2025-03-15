
import { createContext, useContext } from 'react';
import { WalletProvider } from '@/config/wallets';

interface WalletContextType {
  isConnected: boolean;
  selectedWallet: WalletProvider | null;
  address: string | null;
  walletAddress: string | null; // Added this property to mirror 'address'
  connect: (wallet: WalletProvider) => Promise<void>;
  disconnect: () => Promise<void>;
}

export const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  selectedWallet: null,
  address: null,
  walletAddress: null, // Initialize as null
  connect: async () => {},
  disconnect: async () => {}
});

export const useWallet = () => useContext(WalletContext);
