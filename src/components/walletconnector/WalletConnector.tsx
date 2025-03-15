
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
  DialogDescription,
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
        // Close our dialog first
        setOpen(false);
        // Connect will trigger RainbowKit modal directly
        await connect(wallet);
        return;
      }
      
      await connect(wallet);
      setOpen(false);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // If RainbowKit is selected but not connected, show the RainbowKit connect button
  if (selectedWallet?.isRainbowKit && !isConnected) {
    return <ConnectButton />;
  }
  
  // Render the RainbowKit ConnectButton when RainbowKit is selected and connected
  if (isConnected && selectedWallet?.isRainbowKit) {
    return <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />;
  }
  
  // Otherwise render our custom dialog for wallet selection
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
          <DialogDescription className="text-white/70">
            Select a wallet to connect to UNIKRON Swap
          </DialogDescription>
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
            walletProviders={WALLET_PROVIDERS} 
            onConnect={handleWalletConnect} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnector;
