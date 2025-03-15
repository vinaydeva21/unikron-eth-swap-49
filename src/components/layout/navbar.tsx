
import { ModeToggle } from "@/components/mode-toggle";
import WalletConnector from "@/components/walletconnector/WalletConnector";
import NetworkToggle from "@/components/NetworkToggle";
import { useTheme } from "next-themes";

const Navbar = () => {
  const { theme } = useTheme();
  
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 h-24 backdrop-blur-md ${theme === 'dark' ? 'bg-unikron-navy/50' : 'bg-white/50'}`}>
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/f7bf7061-1d66-4b9a-8b8a-c02479456db5.png"
            alt="UNIKRON"
            className="h-10" 
          />
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
