
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
