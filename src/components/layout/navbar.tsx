
import { useState } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import ThemeToggle from "@/components/ThemeToggle";
import WalletConnector from "@/components/walletconnector/WalletConnector";
import { useWallet } from "@/context/walletContext";

const Navbar = () => {
  const { isConnected, selectedWallet } = useWallet();
  
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
            
            {selectedWallet?.isRainbowKit ? (
              <ConnectButton showBalance={false} />
            ) : (
              <WalletConnector />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
