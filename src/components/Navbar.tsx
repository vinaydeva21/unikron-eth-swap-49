
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import { Wallet } from "lucide-react";

const Navbar = () => {
  const [connected, setConnected] = useState(false);
  
  const handleConnect = () => {
    // This would integrate with a real wallet provider
    setConnected(!connected);
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
            
            <Button 
              onClick={handleConnect}
              className="bg-unikron-blue hover:bg-unikron-blue-light text-white transition-all duration-300"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {connected ? "Disconnect Wallet" : "Connect Wallet"}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
