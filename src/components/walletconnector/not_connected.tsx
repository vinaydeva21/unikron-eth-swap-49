
import { WalletProvider } from '@/config/wallets';
import { WalletIcon } from './walletIcons';

interface NotConnectedProps {
  walletProviders: WalletProvider[];
  onConnect: (wallet: WalletProvider) => void;
}

const NotConnected = ({ walletProviders, onConnect }: NotConnectedProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {walletProviders.map((wallet) => (
        <button
          key={wallet.id}
          className="flex flex-col items-center justify-center p-4 rounded-xl border border-unikron-blue/20 hover:bg-unikron-blue/10 transition-all duration-300"
          onClick={() => onConnect(wallet)}
        >
          <WalletIcon 
            wallet={wallet} 
            className="h-12 w-12 mb-2"
          />
          <span className="text-sm text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
            {wallet.name}
          </span>
        </button>
      ))}
    </div>
  );
};

export default NotConnected;
