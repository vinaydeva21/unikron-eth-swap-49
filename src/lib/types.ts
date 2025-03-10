
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
