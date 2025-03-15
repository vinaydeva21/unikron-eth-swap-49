
import { WalletProvider } from './wallets';
import { Network } from '@/lib/types';

// App configuration
export const APP_CONFIG = {
  name: "UNIKRON Swap",
  version: "1.0.0",
  apiUrl: "https://api-v2.symbiosis.finance/crosschain",
  testnetApiUrl: "https://api.testnet.symbiosis.finance/crosschain",
  chainExplorerUrls: {
    ethereum: "https://etherscan.io",
    arbitrum: "https://arbiscan.io",
    polygonzk: "https://zkevm.polygonscan.com",
    bitcoin: "https://blockstream.info",
    ton: "https://tonscan.org",
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
    id: "bitcoin",
    name: "Bitcoin",
    icon: "/tokens/btc.svg",  // Note: We'll need to add this asset
    chainId: 9000  // Using a custom chainId for Bitcoin
  },
  {
    id: "ton",
    name: "TON",
    icon: "/tokens/ton.svg",  // Note: We'll need to add this asset
    chainId: 9010  // Using a custom chainId for TON
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
    swap: "0x0000000000000000000000000000000000000000", // Replace with actual mainnet address
    router: "0x0000000000000000000000000000000000000000",
  },
  arbitrum: {
    swap: "0x0000000000000000000000000000000000000000",
    router: "0x0000000000000000000000000000000000000000",
  },
  sepolia: {
    swap: "0x0000000000000000000000000000000000000000", // Replace with your deployed contract address
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
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH
      chainId: 1,
      price: 3500
    },
    {
      id: "weth",
      symbol: "WETH",
      name: "Wrapped Ethereum",
      icon: "/tokens/eth.svg",
      decimals: 18,
      network: "ethereum",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH address
      chainId: 1,
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
      chainId: 1,
      price: 1
    }
  ],
  bitcoin: [
    {
      id: "btc",
      symbol: "BTC",
      name: "Bitcoin",
      icon: "/tokens/btc.svg",
      decimals: 8,
      network: "bitcoin",
      chainId: 9000,
      price: 65000
    }
  ],
  ton: [
    {
      id: "ton",
      symbol: "TON",
      name: "Toncoin",
      icon: "/tokens/ton.svg",
      decimals: 9,
      network: "ton",
      chainId: 9010,
      price: 7.5
    }
  ],
  sepolia: [
    {
      id: "eth-sepolia",
      symbol: "ETH",
      name: "Sepolia ETH",
      icon: "/tokens/eth.svg",
      decimals: 18,
      network: "sepolia",
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH
      chainId: 11155111,
      price: 3500
    },
    {
      id: "weth-sepolia",
      symbol: "WETH",
      name: "Wrapped ETH (Sepolia)",
      icon: "/tokens/eth.svg", 
      decimals: 18,
      network: "sepolia",
      address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // Wrapped ETH on Sepolia
      chainId: 11155111,
      price: 3500
    },
    {
      id: "usdt-sepolia",
      symbol: "USDT",
      name: "Test USDT",
      icon: "/tokens/usdt.svg",
      decimals: 6,
      network: "sepolia",
      address: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06", // Example USDT on Sepolia
      chainId: 11155111,
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
      chainId: 42161,
      price: 1.2
    },
    {
      id: "eth-arb",
      symbol: "ETH",
      name: "Ethereum on Arbitrum",
      icon: "/tokens/eth.svg",
      decimals: 18,
      network: "arbitrum",
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH
      chainId: 42161,
      price: 3500
    },
    {
      id: "weth-arb",
      symbol: "WETH",
      name: "Wrapped ETH (Arbitrum)",
      icon: "/tokens/eth.svg",
      decimals: 18,
      network: "arbitrum",
      address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH on Arbitrum
      chainId: 42161,
      price: 3500
    }
  ]
};

// Symbiosis testnet tokens with valid addresses from their testnet documentation
export const SYMBIOSIS_TESTNET_TOKENS = {
  sepolia: [
    {
      id: "eth-sepolia",
      symbol: "ETH",
      name: "Sepolia ETH",
      icon: "/tokens/eth.svg",
      decimals: 18,
      network: "sepolia",
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH
      chainId: 11155111,
      price: 3500
    },
    {
      id: "usdt-sepolia",
      symbol: "USDT",
      name: "Test USDT",
      icon: "/tokens/usdt.svg",
      decimals: 6,
      network: "sepolia",
      address: "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0", // From Symbiosis docs
      chainId: 11155111,
      price: 1
    }
  ],
  bitcoin_testnet: [
    {
      id: "btc-testnet",
      symbol: "BTC",
      name: "Bitcoin Testnet",
      icon: "/tokens/btc.svg",
      decimals: 8,
      network: "bitcoin_testnet",
      chainId: 9001,
      price: 65000
    }
  ],
  ton_testnet: [
    {
      id: "ton-testnet",
      symbol: "TON",
      name: "TON Testnet",
      icon: "/tokens/ton.svg",
      decimals: 9,
      network: "ton_testnet",
      chainId: 9011,
      price: 7.5
    }
  ],
  bsc_testnet: [
    {
      id: "bnb-testnet",
      symbol: "BNB",
      name: "BSC Testnet BNB",
      icon: "/tokens/arb.svg", // Using arb as placeholder
      decimals: 18,
      network: "bsc_testnet",
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native BNB
      chainId: 97,
      price: 580
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
