
// Token represents a cryptocurrency token
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

// Network represents a blockchain network
export interface Network {
  id: string;
  name: string;
  icon: string;
  chainId?: number;
}

// SwapState represents the state of a swap operation
export interface SwapState {
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  toAmount: string;
  slippage: number;
}

// WalletInfo represents information about a connected wallet
export interface WalletInfo {
  address: string;
  chainId: number;
  balance: string;
  connected: boolean;
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

// User represents a user profile
export interface User {
  address: string;
  transactions: Transaction[];
  favorites: Token[];
  settings: UserSettings;
}

// UserSettings represents user preferences
export interface UserSettings {
  slippage: number;
  deadline: number;
  theme: 'light' | 'dark' | 'system';
  gasSpeed: 'standard' | 'fast' | 'instant';
}
