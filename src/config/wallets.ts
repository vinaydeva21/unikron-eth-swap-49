
export interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  networks: string[];
  isRainbowKit?: boolean;
  isCardano?: boolean;
}

export const WALLET_PROVIDERS: WalletProvider[] = [
  {
    id: 'rainbowkit',
    name: 'Ethereum Wallets',
    icon: '/wallets/rainbow.svg',
    networks: ['ethereum', 'arbitrum'],
    isRainbowKit: true
  },
  {
    id: 'nami',
    name: 'Nami',
    icon: '/wallets/nami.svg',
    networks: ['cardano'],
    isCardano: true
  },
  {
    id: 'yoroi',
    name: 'Yoroi',
    icon: '/wallets/yoroi.svg',
    networks: ['cardano'],
    isCardano: true
  }
];
