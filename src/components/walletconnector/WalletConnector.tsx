
import { useState, useEffect } from 'react';
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
import { useNetwork } from '@/context/networkContext';
import { NETWORKS } from '@/lib/constants';

const WalletConnector = () => {
  const [open, setOpen] = useState(false);
  const { isConnected, selectedWallet, connect, disconnect, walletAddress } = useWallet();
  const { selectedNetwork } = useNetwork();
  const [filteredWallets, setFilteredWallets] = useState<WalletProvider[]>([]);
  
  // Update filtered wallets whenever the network changes
  useEffect(() => {
    if (selectedNetwork) {
      // For Ethereum and Arbitrum networks, only show RainbowKit
      if (['ethereum', 'arbitrum'].includes(selectedNetwork.id)) {
        const rainbowKit = WALLET_PROVIDERS.find(w => w.isRainbowKit);
        setFilteredWallets(rainbowKit ? [rainbowKit] : []);
      } 
      // For Cardano network, show Cardano-compatible wallets
      else if (selectedNetwork.id === 'cardano') {
        const cardanoWallets = WALLET_PROVIDERS.filter(w => w.isCardano);
        setFilteredWallets(cardanoWallets);
      }
      // Default case, show all wallets
      else {
        setFilteredWallets(WALLET_PROVIDERS);
      }
    } else {
      setFilteredWallets(WALLET_PROVIDERS);
    }
  }, [selectedNetwork]);
  
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

  // For Ethereum and Arbitrum networks, directly use RainbowKit if already connected
  if (selectedNetwork && ['ethereum', 'arbitrum'].includes(selectedNetwork.id)) {
    // If connected with RainbowKit wallet
    if (isConnected && selectedWallet?.isRainbowKit) {
      return <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />;
    }
    
    // If not connected, return RainbowKit button
    if (!isConnected) {
      return <ConnectButton />;
    }
  }
  
  // For all other scenarios, use our custom dialog
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
            walletProviders={filteredWallets} 
            onConnect={handleWalletConnect} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnector;
