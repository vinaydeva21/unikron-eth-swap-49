
import { useState, useEffect } from "react";
import { ArrowDownUp, Settings, Loader2 } from "lucide-react";
import { NETWORKS, SLIPPAGE_OPTIONS } from "@/lib/constants";
import { Token } from "@/lib/types";
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
import { fetchSymbiosisTokens, connectWallet, calculateSwapAmount } from "@/services/tokenService";
import { 
  executeContractSwap, 
  isSwapAvailable, 
  getCurrentTransactionStatus,
  resetTransactionState 
} from "@/services/swapContractService";
import { NETWORK_TOKENS } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";

const SwapCard = () => {
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [slippage, setSlippage] = useState(2);
  const [walletConnected, setWalletConnected] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestnet, setIsTestnet] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [txStatus, setTxStatus] = useState<'pending' | 'success' | 'error' | null>(null);
  const [swapProgress, setSwapProgress] = useState(0);
  
  useEffect(() => {
    const loadTokens = async () => {
      setIsLoading(true);
      try {
        const tokens = await fetchSymbiosisTokens(selectedNetwork.id);
        const networkSpecificTokens = tokens.filter(token => token.network === selectedNetwork.id);
        setAvailableTokens(networkSpecificTokens.length > 0 ? networkSpecificTokens : NETWORK_TOKENS[selectedNetwork.id] || []);
        
        setFromToken(null);
        setToToken(null);
        setFromAmount("");
        setToAmount("");
      } catch (error) {
        console.error("Error loading tokens:", error);
        setAvailableTokens(NETWORK_TOKENS[selectedNetwork.id] || []);
        toast.error("Failed to load tokens. Using fallback data.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTokens();
  }, [selectedNetwork]);
  
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          // Use the proper method to check if wallet is connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          setWalletConnected(accounts && accounts.length > 0);
        } catch (error) {
          console.error("Error checking wallet connection:", error);
          setWalletConnected(false);
        }
      }
    };
    
    checkWalletConnection();
  }, []);
  
  useEffect(() => {
    let progressInterval: number | undefined;
    
    if (isSwapping) {
      setSwapProgress(0);
      progressInterval = window.setInterval(() => {
        setSwapProgress((prev) => {
          return prev < 90 ? prev + 10 : prev;
        });
      }, 1000);
    } else if (txStatus === 'success') {
      setSwapProgress(100);
    } else if (txStatus === null) {
      setSwapProgress(0);
    }
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isSwapping, txStatus]);
  
  useEffect(() => {
    if (isSwapping) {
      const checkTxStatus = setInterval(() => {
        const status = getCurrentTransactionStatus();
        if (status && status !== 'pending') {
          setTxStatus(status);
          setIsSwapping(false);
          
          if (status === 'success') {
            setTimeout(() => {
              resetTransactionState();
              setTxStatus(null);
              setSwapProgress(0);
              setFromAmount("");
              setToAmount("");
            }, 5000);
          }
        }
      }, 1000);
      
      return () => clearInterval(checkTxStatus);
    }
  }, [isSwapping]);
  
  const handleSwapTokens = () => {
    if (!fromToken || !toToken) return;
    
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };
  
  const handleNetworkChange = (network: typeof NETWORKS[0]) => {
    setSelectedNetwork(network);
    setTxStatus(null);
    resetTransactionState();
  };
  
  useEffect(() => {
    const updateToAmount = () => {
      console.log("Updating to amount with:", { 
        fromToken: fromToken?.symbol, 
        toToken: toToken?.symbol, 
        fromAmount 
      });
      
      if (!fromToken || !toToken || !fromAmount) {
        setToAmount("");
        return;
      }
      
      const calculatedAmount = calculateSwapAmount(fromToken, toToken, fromAmount);
      console.log("Calculated amount:", calculatedAmount);
      setToAmount(calculatedAmount);
    };
    
    updateToAmount();
  }, [fromToken, toToken, fromAmount]);
  
  const handleFromAmountChange = (value: string) => {
    if (/^[0-9]*\.?[0-9]*$/.test(value) || value === "") {
      setFromAmount(value);
    }
  };
  
  const handleFromTokenSelect = (token: Token) => {
    console.log("From token selected:", token.symbol);
    setFromToken(token);
  };
  
  const handleToTokenSelect = (token: Token) => {
    console.log("To token selected:", token.symbol);
    setToToken(token);
  };
  
  const handleConnectWallet = async () => {
    try {
      const connected = await connectWallet();
      if (connected) {
        setWalletConnected(true);
        toast.success("Wallet connected successfully");
      } else {
        toast.error("Failed to connect wallet. Please try again.");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet. Please try again.");
    }
  };
  
  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      toast.error("Please select tokens and enter a valid amount");
      return;
    }
    
    setTxStatus(null);
    resetTransactionState();
    
    if (!isSwapAvailable(selectedNetwork.id)) {
      toast.error(`Real-time swaps not supported on ${selectedNetwork.name} yet`);
      toast.success(`Swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol} (simulated)`);
      setFromAmount("");
      setToAmount("");
      return;
    }
    
    setIsSwapping(true);
    
    try {
      const success = await executeContractSwap(
        fromToken,
        toToken,
        fromAmount,
        slippage,
        isTestnet
      );
      
    } catch (error) {
      console.error("Swap error:", error);
      toast.error(`Swap failed: ${(error as Error).message || "Unknown error"}`);
      setIsSwapping(false);
      setTxStatus('error');
    }
  };
  
  return (
    <div className="swap-card p-5 slide-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-white">Swap</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center mr-2">
            <label className="text-sm text-white/70 mr-2">Testnet</label>
            <input
              type="checkbox"
              checked={isTestnet}
              onChange={(e) => setIsTestnet(e.target.checked)}
              className="h-4 w-4 accent-unikron-blue"
            />
          </div>
          
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
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-8 w-8 text-unikron-blue animate-spin mb-3" />
          <p className="text-white/70">Loading tokens...</p>
        </div>
      ) : (
        <>
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
                disabled={isSwapping || txStatus === 'success'}
              />
              <TokenSelector
                selectedToken={fromToken}
                onSelectToken={handleFromTokenSelect}
                label="From"
                availableTokens={availableTokens}
              />
            </div>
            <div className="mt-1 text-sm text-white/50 text-left">
              {fromAmount && fromToken && parseFloat(fromAmount) > 0 && fromToken.price
                ? `~ $${(parseFloat(fromAmount) * fromToken.price).toFixed(2)}`
                : ""}
            </div>
          </div>
          
          <div className="flex justify-center -my-4 z-10 relative">
            <button 
              className="swap-connector"
              onClick={handleSwapTokens}
              disabled={!fromToken || !toToken || isSwapping || txStatus === 'success'}
            >
              <ArrowDownUp className="h-4 w-4" />
            </button>
          </div>
          
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
                onSelectToken={handleToTokenSelect}
                label="To"
                availableTokens={availableTokens}
              />
            </div>
            <div className="mt-1 text-sm text-white/50 text-left">
              {toAmount && toToken && parseFloat(toAmount) > 0 && toToken.price
                ? `~ $${(parseFloat(toAmount) * toToken.price).toFixed(2)}`
                : ""}
            </div>
          </div>
          
          {(isSwapping || txStatus === 'success' || txStatus === 'error') && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-white/70">
                  {txStatus === 'success' 
                    ? 'Swap completed' 
                    : txStatus === 'error' 
                      ? 'Swap failed' 
                      : 'Processing swap...'}
                </span>
                <span className="text-xs text-white/70">{swapProgress}%</span>
              </div>
              <Progress 
                value={swapProgress} 
                className={`h-2 ${
                  txStatus === 'success' 
                    ? 'bg-green-500/20' 
                    : txStatus === 'error' 
                      ? 'bg-red-500/20' 
                      : 'bg-unikron-blue/20'
                }`}
              />
            </div>
          )}
          
          <SwapButton 
            connected={walletConnected}
            onConnect={handleConnectWallet}
            onSwap={handleSwap}
            fromToken={fromToken}
            toToken={toToken}
            fromAmount={fromAmount}
            isSwapping={isSwapping}
            txStatus={txStatus}
          />
        </>
      )}
      
      {fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0 && (
        <div className="mt-4 bg-black/10 rounded-lg p-3 text-sm text-white/70">
          <div className="flex justify-between mb-1">
            <span>Rate</span>
            <span>1 {fromToken.symbol} ≈ {(toToken.price && fromToken.price) 
              ? (fromToken.price / toToken.price).toFixed(6) 
              : '0'} {toToken.symbol}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Network</span>
            <span className="text-unikron-blue">{selectedNetwork.name} {isTestnet ? '(Testnet)' : '(Mainnet)'}</span>
          </div>
          <div className="flex justify-between">
            <span>Slippage</span>
            <span>{slippage}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapCard;
