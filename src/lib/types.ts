
export interface Token {
  id?: string;
  symbol: string;
  name: string;
  icon?: string;
  decimals: number;
  network?: string;
  networks?: string[];
  chainId?: number;
  address?: string;
  price?: number;
  logoURI?: string;
}

export interface Network {
  id: string;
  name: string;
  icon: string;
  chainId?: number;
}

export interface SwapState {
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  toAmount: string;
  slippage: number;
}

// Transaction status
export type TransactionStatus = 'pending' | 'success' | 'error' | null;

// Transaction represents a blockchain transaction
export interface Transaction {
  hash: string;
  status: TransactionStatus;
  timestamp: number;
  type: 'swap' | 'approve' | 'transfer' | 'other';
  data?: {
    fromToken?: string;
    toToken?: string;
    fromAmount?: string;
    toAmount?: string;
    chainId?: number;
    [key: string]: any;
  };
}

export interface WalletInfo {
  address: string;
  chainId: number;
  balance: string;
  connected: boolean;
}

export interface User {
  address: string;
  transactions: Transaction[];
  favorites: Token[];
  settings: UserSettings;
}

export interface UserSettings {
  slippage: number;
  deadline: number;
  theme: 'light' | 'dark' | 'system';
  gasSpeed: 'standard' | 'fast' | 'instant';
}
