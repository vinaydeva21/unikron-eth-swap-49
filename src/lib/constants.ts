
export type Network = {
  id: string;
  name: string;
  icon: string;
};

export type Token = {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  decimals: number;
  network: string;
};

export const NETWORKS: Network[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    icon: "/logos/ethereum.svg"
  },
  {
    id: "cardano",
    name: "Cardano",
    icon: "/logos/cardano.svg"
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    icon: "/logos/arbitrum.svg"
  }
];

export const TOKENS: Token[] = [
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    icon: "/tokens/eth.svg",
    decimals: 18,
    network: "ethereum"
  },
  {
    id: "ada",
    symbol: "ADA",
    name: "Cardano",
    icon: "/tokens/ada.svg",
    decimals: 6,
    network: "cardano"
  },
  {
    id: "arb",
    symbol: "ARB",
    name: "Arbitrum",
    icon: "/tokens/arb.svg",
    decimals: 18,
    network: "arbitrum"
  },
  {
    id: "usdt",
    symbol: "USDT",
    name: "Tether USD",
    icon: "/tokens/usdt.svg",
    decimals: 6,
    network: "ethereum"
  },
  {
    id: "usdc",
    symbol: "USDC",
    name: "USD Coin",
    icon: "/tokens/usdc.svg",
    decimals: 6,
    network: "ethereum"
  }
];

// Default slippage options
export const SLIPPAGE_OPTIONS = [0.5, 1, 2, 5];
