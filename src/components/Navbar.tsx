
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import { Wallet } from "lucide-react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WALLET_PROVIDERS, WalletProvider } from "@/config/wallets";
import { useAccount } from 'wagmi';
import { toast } from "sonner";

const Navbar = () => {
  const [connected, setConnected] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<WalletProvider | null>(null);
  const [open, setOpen] = useState(false);
  
  // Get Ethereum wallet connection state from wagmi
  const { isConnected: isEthWalletConnected } = useAccount();
  
  // Update connection status when wagmi connection changes
  useEffect(() => {
    if (isEthWalletConnected && !connected) {
      const rainbowWallet = WALLET_PROVIDERS.find(w => w.id === 'rainbowkit');
      if (rainbowWallet) {
        setSelectedWallet(rainbowWallet);
        setConnected(true);
      }
    }
  }, [isEthWalletConnected, connected]);
  
  const handleWalletConnect = async (wallet: WalletProvider) => {
    try {
      if (wallet.isRainbowKit) {
        // Close the dialog as Rainbow Kit will show its own UI
        setOpen(false);
        // No need to do anything else here as Rainbow Kit handles the connection
        return;
      }
      
      switch (wallet.id) {
        case 'metamask':
          if (window.ethereum) {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (accounts && accounts.length > 0) {
              setConnected(true);
              setSelectedWallet(wallet);
              setOpen(false);
              toast.success(`Connected to ${wallet.name}`);
            }
          } else {
            window.open('https://metamask.io/download/', '_blank');
            toast.info(`Please install ${wallet.name} to continue`);
          }
          break;
          
        case 'nami':
          if ((window as any).cardano?.nami) {
            const api = await (window as any).cardano.nami.enable();
            if (api) {
              setConnected(true);
              setSelectedWallet(wallet);
              setOpen(false);
              toast.success(`Connected to ${wallet.name}`);
            }
          } else {
            window.open('https://namiwallet.io/', '_blank');
            toast.info(`Please install ${wallet.name} to continue`);
          }
          break;
          
        case 'yoroi':
          if ((window as any).cardano?.yoroi) {
            const api = await (window as any).cardano.yoroi.enable();
            if (api) {
              setConnected(true);
              setSelectedWallet(wallet);
              setOpen(false);
              toast.success(`Connected to ${wallet.name}`);
            }
          } else {
            window.open('https://yoroi-wallet.com/', '_blank');
            toast.info(`Please install ${wallet.name} to continue`);
          }
          break;
          
        case 'walletconnect':
          // For now just show it's selected
          setConnected(true);
          setSelectedWallet(wallet);
          setOpen(false);
          toast.success(`Connected to ${wallet.name}`);
          break;
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(`Failed to connect to ${wallet.name}`);
    }
  };

  // Function to render either the connect button or the Rainbow Kit button
  const renderWalletButton = () => {
    if (connected && selectedWallet?.isRainbowKit) {
      return <ConnectButton showBalance={false} />;
    }
    
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            className="bg-unikron-blue hover:bg-unikron-blue-light text-white transition-all duration-300"
          >
            <Wallet className="mr-2 h-4 w-4" />
            {connected ? selectedWallet?.name || "Connected" : "Connect Wallet"}
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-unikron-navy-light border border-unikron-blue/20 text-white">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 p-4">
            {WALLET_PROVIDERS.map((wallet) => (
              <button
                key={wallet.id}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-unikron-blue/20 hover:bg-unikron-blue/10 transition-all duration-300"
                onClick={() => handleWalletConnect(wallet)}
              >
                <img 
                  src={wallet.icon} 
                  alt={wallet.name} 
                  className="h-12 w-12 mb-2"
                />
                <span className="text-sm text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
                  {wallet.name}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-lg bg-unikron-navy-dark/70 border-b border-unikron-blue/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/9ebeb73c-2a8e-4f6d-800a-ee4febfde318.png" 
              alt="UNIKRON" 
              className="h-8 mr-3" 
            />
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {renderWalletButton()}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
