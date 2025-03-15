
import { WalletProvider } from './wallets';
import { Network } from '@/lib/types';

// App configuration
export const APP_CONFIG = {
  name: "UNIKRON Swap",
  version: "1.0.0",
  apiUrl: "https://api-v2.symbiosis.finance/crosschain",
  chainExplorerUrls: {
    ethereum: "https://etherscan.io",
    arbitrum: "https://arbiscan.io",
    polygonzk: "https://zkevm.polygonscan.com",
    goerli: "https://goerli.etherscan.io",
    sepolia: "https://sepolia.etherscan.io",
  }
};

// Web3 RPC endpoints
export const RPC_URLS = {
  ethereum: "https://ethereum.publicnode.com",
  arbitrum: "https://arbitrum-one.publicnode.com",
  goerli: "https://goerli.infura.io/v3/YOUR_INFURA_KEY",
  sepolia: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
};

// Available networks
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

// Contract addresses
export const CONTRACT_ADDRESSES = {
  ethereum: {
    swap: "0x0000000000000000000000000000000000000000",
    router: "0x0000000000000000000000000000000000000000",
  },
  arbitrum: {
    swap: "0x0000000000000000000000000000000000000000",
    router: "0x0000000000000000000000000000000000000000",
  },
  goerli: {
    swap: "0x0000000000000000000000000000000000000000",
    router: "0x0000000000000000000000000000000000000000",
  }
};

// Default tokens
export const DEFAULT_TOKENS = {
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

// Slippage options
export const SLIPPAGE_OPTIONS = [0.5, 1, 2, 5];

// Gas speed options
export const GAS_SPEED_OPTIONS = [
  { name: "Standard", value: "standard", multiplier: 1 },
  { name: "Fast", value: "fast", multiplier: 1.5 },
  { name: "Instant", value: "instant", multiplier: 2 },
];
