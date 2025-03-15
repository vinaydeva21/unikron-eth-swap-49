
import { useState } from 'react';
import { WALLET_PROVIDERS, WalletProvider } from '@/config/wallets';
import { useWallet } from '@/context/walletContext';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import NotConnected from './not_connected';
import { WalletIcon } from './walletIcons';

const WalletConnector = () => {
  const [open, setOpen] = useState(false);
  const { isConnected, selectedWallet, connect, disconnect, walletAddress } = useWallet();
  
  // Function to format an address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  // Function to handle wallet connection
  const handleWalletConnect = async (wallet: WalletProvider) => {
    try {
      if (wallet.isRainbowKit) {
        // Close the dialog as RainbowKit will show its own UI
        setOpen(false);
        return;
      }
      
      await connect(wallet);
      setOpen(false);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Function to render either the connect button or the Rainbow Kit button
  const renderWalletButton = () => {
    if (isConnected && selectedWallet?.isRainbowKit) {
      return <ConnectButton showBalance={false} />;
    }
    
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            className="bg-unikron-blue hover:bg-unikron-blue-light text-white transition-all duration-300"
          >
            {isConnected ? (
              <div className="flex items-center">
                <WalletIcon wallet={selectedWallet} className="mr-2 h-4 w-4" />
                {walletAddress ? formatAddress(walletAddress) : selectedWallet?.name || "Connected"}
              </div>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-unikron-navy-light border border-unikron-blue/20 text-white">
          <DialogHeader>
            <DialogTitle>
              {isConnected ? "Wallet Connected" : "Connect Wallet"}
            </DialogTitle>
          </DialogHeader>
          
          {isConnected ? (
            <div className="flex flex-col items-center gap-4 p-4">
              <WalletIcon wallet={selectedWallet} className="h-16 w-16" />
              <div className="text-center">
                <h3 className="font-medium">{selectedWallet?.name}</h3>
                {walletAddress && (
                  <p className="text-sm text-white/70">{formatAddress(walletAddress)}</p>
                )}
              </div>
              <Button 
                variant="destructive" 
                onClick={() => {
                  disconnect();
                  setOpen(false);
                }}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <NotConnected 
              walletProviders={WALLET_PROVIDERS.filter(w => w.id !== 'walletconnect')} 
              onConnect={handleWalletConnect} 
            />
          )}
        </DialogContent>
      </Dialog>
    );
  };
  
  return renderWalletButton();
};

export default WalletConnector;
