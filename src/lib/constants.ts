
import { Network, Token } from './types';

export const NETWORKS: Network[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    icon: "/logos/ethereum.svg",
    chainId: 1
  },
  {
    id: "cardano",
    name: "Cardano",
    icon: "/logos/cardano.svg",
    chainId: 2000
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    icon: "/logos/arbitrum.svg",
    chainId: 42161
  }
];

// Token lists per network (initial fallback data)
export const NETWORK_TOKENS: { [key: string]: Token[] } = {
  ethereum: [
    {
      id: "eth",
      symbol: "ETH",
      name: "Ethereum",
      icon: "/tokens/eth.svg",
      decimals: 18,
      network: "ethereum"
    },
    {
      id: "usdt",
      symbol: "USDT",
      name: "Tether USD",
      icon: "/tokens/usdt.svg",
      decimals: 6,
      network: "ethereum"
    }
  ],
  cardano: [
    {
      id: "ada",
      symbol: "ADA",
      name: "Cardano",
      icon: "/tokens/ada.svg",
      decimals: 6,
      network: "cardano"
    }
  ],
  arbitrum: [
    {
      id: "arb",
      symbol: "ARB",
      name: "Arbitrum",
      icon: "/tokens/arb.svg",
      decimals: 18,
      network: "arbitrum"
    },
    {
      id: "eth-arb",
      symbol: "ETH",
      name: "Ethereum on Arbitrum",
      icon: "/tokens/eth.svg",
      decimals: 18,
      network: "arbitrum"
    }
  ]
};

export const SLIPPAGE_OPTIONS = [0.5, 1, 2, 5];
