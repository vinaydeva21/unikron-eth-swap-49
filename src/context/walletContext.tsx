
import { createContext, useContext, useState, useEffect } from 'react';
import { WALLET_PROVIDERS, WalletProvider } from '@/config/wallets';
import { toast } from 'sonner';

interface WalletContextType {
  isConnected: boolean;
  selectedWallet: WalletProvider | null;
  connect: (wallet: WalletProvider) => Promise<boolean>;
  disconnect: () => void;
  walletAddress: string | null;
}

const WalletContext = createContext<WalletContextType>({
  isConnected: false,
  selectedWallet: null,
  connect: async () => false,
  disconnect: () => {},
  walletAddress: null,
});

export const useWallet = () => useContext(WalletContext);

export default WalletContext;
