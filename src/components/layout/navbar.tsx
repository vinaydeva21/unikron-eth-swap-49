
import { ModeToggle } from "@/components/mode-toggle";
import WalletConnector from "@/components/walletconnector/WalletConnector";
import NetworkToggle from "@/components/NetworkToggle";

const Navbar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 h-24 backdrop-blur-md">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src="/logos/ethereum.svg"
            alt="UNIKRON Swap"
            className="h-10 w-10 mr-3" 
          />
          <span className="text-xl font-semibold text-white">
            UNIKRON Swap
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <NetworkToggle />
          <ModeToggle />
          <WalletConnector />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
