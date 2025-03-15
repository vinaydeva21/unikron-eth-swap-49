
import { WalletProvider } from '@/config/wallets';
import { Wallet } from 'lucide-react';

interface WalletIconProps {
  wallet: WalletProvider | null;
  className?: string;
}

export const WalletIcon = ({ wallet, className = "h-6 w-6" }: WalletIconProps) => {
  if (!wallet) {
    return <Wallet className={className} />;
  }
  
  // Use the wallet icon if available
  if (wallet.icon) {
    return (
      <img 
        src={wallet.icon} 
        alt={wallet.name} 
        className={className}
      />
    );
  }
  
  // Fallback to the Wallet icon
  return <Wallet className={className} />;
};
