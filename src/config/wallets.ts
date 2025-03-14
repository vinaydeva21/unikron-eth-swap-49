
import { Network } from '@/lib/types';

export interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  networks: string[];
  isRainbowKit?: boolean;
}

export const WALLET_PROVIDERS: WalletProvider[] = [
  {
    id: 'rainbowkit',
    name: 'Rainbow Wallet',
    icon: '/wallets/rainbow.svg',
    networks: ['ethereum', 'arbitrum'],
    isRainbowKit: true
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '/wallets/metamask.svg',
    networks: ['ethereum', 'arbitrum']
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '/wallets/walletconnect.svg',
    networks: ['ethereum', 'arbitrum']
  },
  {
    id: 'nami',
    name: 'Nami',
    icon: '/wallets/nami.svg',
    networks: ['cardano']
  },
  {
    id: 'yoroi',
    name: 'Yoroi',
    icon: '/wallets/yoroi.svg',
    networks: ['cardano']
  }
];

// Add network tokens mapping for SwapCard component
export const NETWORK_TOKENS = {
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
