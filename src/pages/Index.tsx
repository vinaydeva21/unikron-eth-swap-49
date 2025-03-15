
import { useEffect } from "react";
import Navbar from "@/components/layout/navbar";
import Swap from "@/components/swapcomp/swap";
import { WalletContextProvider } from "@/context/walletProvider";

const Index = () => {
  // Initialize the swap application
  useEffect(() => {
    console.log("Initializing swap application...");
  }, []);
  
  return (
    <WalletContextProvider>
      <div className="min-h-screen bg-unikron-navy relative overflow-hidden">
        {/* Radial gradient background */}
        <div 
          className="absolute inset-0 bg-gradient-radial from-unikron-navy-light/20 to-transparent"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(26, 42, 105, 0.15) 0%, rgba(3, 14, 33, 0) 70%)"
          }}
        ></div>
        
        {/* Navbar */}
        <Navbar />
        
        {/* Main content */}
        <main className="pt-28 pb-12 px-4 sm:px-6 flex flex-col items-center justify-center relative z-10">
          <div className="max-w-md w-full mx-auto">
            <Swap />
          </div>
        </main>
      </div>
    </WalletContextProvider>
  );
};

export default Index;
