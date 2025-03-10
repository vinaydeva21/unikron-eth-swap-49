
import { Network } from '@/lib/types';

export interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  networks: string[];
}

export const WALLET_PROVIDERS: WalletProvider[] = [
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
