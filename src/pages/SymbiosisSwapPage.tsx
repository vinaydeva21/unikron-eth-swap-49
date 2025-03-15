
import { useState } from "react";
import { Helmet } from "react-helmet";
import Navbar from "@/components/layout/navbar";
import SymbiosisSwap from "@/components/SymbiosisSwap";

const SymbiosisSwapPage = () => {
  return (
    <div className="min-h-screen bg-unikron-navy flex flex-col">
      <Helmet>
        <title>Symbiosis Swap | UNIKRON</title>
      </Helmet>
      
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-screen-lg mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Symbiosis Swap</h1>
            <p className="text-white/70">Swap tokens across multiple chains with Symbiosis</p>
          </div>
          
          <div className="flex justify-center">
            <SymbiosisSwap />
          </div>
        </div>
      </main>
      
      <footer className="py-6 border-t border-unikron-blue/10">
        <div className="container mx-auto text-center text-white/50 text-sm">
          UNIKRON Swap &copy; {new Date().getFullYear()} | Powered by Symbiosis
        </div>
      </footer>
    </div>
  );
};

export default SymbiosisSwapPage;
