
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
      network: "ethereum",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH address
      price: 3500
    },
    {
      id: "usdt",
      symbol: "USDT",
      name: "Tether USD",
      icon: "/tokens/usdt.svg",
      decimals: 6,
      network: "ethereum",
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      price: 1
    }
  ],
  cardano: [
    {
      id: "ada",
      symbol: "ADA",
      name: "Cardano",
      icon: "/tokens/ada.svg",
      decimals: 6,
      network: "cardano",
      price: 0.5
    }
  ],
  arbitrum: [
    {
      id: "arb",
      symbol: "ARB",
      name: "Arbitrum",
      icon: "/tokens/arb.svg",
      decimals: 18,
      network: "arbitrum",
      address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
      price: 1.2
    },
    {
      id: "eth-arb",
      symbol: "ETH",
      name: "Ethereum on Arbitrum",
      icon: "/tokens/eth.svg",
      decimals: 18,
      network: "arbitrum",
      address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH on Arbitrum
      price: 3500
    }
  ]
};

export const SLIPPAGE_OPTIONS = [0.5, 1, 2, 5];
