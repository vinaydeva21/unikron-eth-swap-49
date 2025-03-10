
import { useState } from "react";
import { ArrowDownUp, Settings } from "lucide-react";
import { NETWORKS, TOKENS, SLIPPAGE_OPTIONS, Network, Token } from "@/lib/constants";
import TokenSelector from "./TokenSelector";
import NetworkSelector from "./NetworkSelector";
import SwapButton from "./SwapButton";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

const SwapCard = () => {
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState(2);
  const [walletConnected, setWalletConnected] = useState(false);
  
  // Handle swapping the tokens
  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };
  
  // Handle network change
  const handleNetworkChange = (network: Network) => {
    setSelectedNetwork(network);
    // In a real app, you might want to filter tokens based on the network
  };
  
  // Calculate the swap rate (simplified for demo)
  const calculateSwapRate = () => {
    if (!fromAmount || parseFloat(fromAmount) === 0 || !fromToken || !toToken) {
      setToAmount("");
      return;
    }
    
    // This is a mock calculation - in a real app, you'd fetch real rates
    const mockRate = fromToken.symbol === "ETH" ? 2000 : 
                    fromToken.symbol === "ADA" ? 0.5 : 
                    fromToken.symbol === "ARB" ? 1.2 : 1;
    
    const amount = parseFloat(fromAmount) * mockRate;
    setToAmount(amount.toFixed(6));
  };
  
  // Update the to amount when from amount or tokens change
  const handleFromAmountChange = (value: string) => {
    // Only allow numbers and a single decimal point
    if (/^[0-9]*\.?[0-9]*$/.test(value) || value === "") {
      setFromAmount(value);
      
      // Mock calculation for the to amount
      if (value && parseFloat(value) > 0 && fromToken && toToken) {
        calculateSwapRate();
      } else {
        setToAmount("");
      }
    }
  };
  
  // Handle connect wallet
  const handleConnectWallet = () => {
    // This would be replaced with actual wallet connection logic
    setWalletConnected(true);
    toast.success("Wallet connected successfully");
  };
  
  // Handle swap
  const handleSwap = () => {
    // This would be replaced with actual swap logic
    toast.success(`Swapped ${fromAmount} ${fromToken?.symbol} for ${toAmount} ${toToken?.symbol}`);
    // Reset the form
    setFromAmount("");
    setToAmount("");
  };
  
  return (
    <div className="swap-card p-5 slide-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-white">Swap</h2>
        <div className="flex items-center gap-3">
          <NetworkSelector 
            selectedNetwork={selectedNetwork}
            onSelectNetwork={handleNetworkChange}
          />
          
          <Popover>
            <PopoverTrigger asChild>
              <button className="settings-button">
                <Settings className="h-4 w-4 text-white/70" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="bg-unikron-navy-light border border-unikron-blue/20 backdrop-blur-xl shadow-xl w-56 p-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white/70">Slippage Tolerance</h3>
                <div className="flex gap-2">
                  {SLIPPAGE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        slippage === option 
                          ? "bg-unikron-blue text-white" 
                          : "bg-black/20 text-white/70"
                      }`}
                      onClick={() => setSlippage(option)}
                    >
                      {option}%
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* From token input */}
      <div className="bg-black/20 rounded-xl p-4 mb-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-white/70">You give</span>
          <span className="text-sm text-unikron-blue cursor-pointer hover:text-unikron-blue-light">
            Max
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={fromAmount}
            onChange={(e) => handleFromAmountChange(e.target.value)}
            placeholder="0"
            className="swap-input text-white"
          />
          <TokenSelector
            selectedToken={fromToken}
            onSelectToken={setFromToken}
            label="From"
          />
        </div>
        <div className="mt-1 text-sm text-white/50 text-left">
          {fromAmount && fromToken && parseFloat(fromAmount) > 0 
            ? `~ $${(parseFloat(fromAmount) * (fromToken.symbol === "USDT" || fromToken.symbol === "USDC" ? 1 : 
                                              fromToken.symbol === "ETH" ? 2000 : 
                                              fromToken.symbol === "ADA" ? 0.5 : 
                                              fromToken.symbol === "ARB" ? 1.2 : 1)).toFixed(2)}`
            : ""}
        </div>
      </div>
      
      {/* Swap direction button */}
      <div className="flex justify-center -my-4 z-10 relative">
        <button 
          className="swap-connector"
          onClick={handleSwapTokens}
        >
          <ArrowDownUp className="h-4 w-4" />
        </button>
      </div>
      
      {/* To token input */}
      <div className="bg-black/20 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-white/70">You get</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={toAmount}
            readOnly
            placeholder="0"
            className="swap-input text-white"
          />
          <TokenSelector
            selectedToken={toToken}
            onSelectToken={setToToken}
            label="To"
          />
        </div>
        <div className="mt-1 text-sm text-white/50 text-left">
          {toAmount && toToken && parseFloat(toAmount) > 0 
            ? `~ $${(parseFloat(toAmount) * (toToken.symbol === "USDT" || toToken.symbol === "USDC" ? 1 : 
                                           toToken.symbol === "ETH" ? 2000 : 
                                           toToken.symbol === "ADA" ? 0.5 : 
                                           toToken.symbol === "ARB" ? 1.2 : 1)).toFixed(2)}`
            : ""}
        </div>
      </div>
      
      {/* Swap button */}
      <SwapButton 
        connected={walletConnected}
        onConnect={handleConnectWallet}
        onSwap={handleSwap}
        fromToken={fromToken}
        toToken={toToken}
        fromAmount={fromAmount}
      />
    </div>
  );
};

export default SwapCard;
