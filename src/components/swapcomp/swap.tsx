
import { useState, useEffect } from "react";
import { ArrowDownUp, Settings } from "lucide-react";
import { NETWORKS, SLIPPAGE_OPTIONS } from "@/lib/constants";
import { Network, Token, SwapState } from "@/lib/types";
import NetworkSelector from "@/components/NetworkSelector";
import SwapInput from "@/components/swapcomp/swapInput";
import SlippageComponent from "@/components/swapcomp/slippage_component";
import { useWallet } from "@/context/walletContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fetchSymbiosisTokens, calculateSwapAmount } from "@/services/tokenService";
import { executeContractSwap, isSwapAvailable, getCurrentTransactionStatus, resetTransactionState } from "@/services/swapContractService";
import { toast } from "sonner";

const Swap = () => {
  const { isConnected, connect, selectedWallet } = useWallet();
  
  // State for network and tokens
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  
  // State for swap parameters
  const [swapState, setSwapState] = useState<SwapState>({
    fromToken: null,
    toToken: null,
    fromAmount: '',
    toAmount: '',
    slippage: 0.5,
  });
  
  // UI state
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [txStatus, setTxStatus] = useState<'pending' | 'success' | 'error' | null>(null);
  
  // Load tokens when network changes
  useEffect(() => {
    const loadTokens = async () => {
      setIsLoadingTokens(true);
      try {
        const tokens = await fetchSymbiosisTokens(selectedNetwork.id);
        setAvailableTokens(tokens);
        
        // Reset token selection if network changes
        setSwapState(prev => ({
          ...prev,
          fromToken: null,
          toToken: null,
          fromAmount: '',
          toAmount: '',
        }));
      } catch (error) {
        console.error("Error loading tokens:", error);
        toast.error("Failed to load tokens. Please try again later.");
      } finally {
        setIsLoadingTokens(false);
      }
    };
    
    loadTokens();
  }, [selectedNetwork]);
  
  // Update calculated amount when parameters change
  useEffect(() => {
    if (swapState.fromToken && swapState.toToken && swapState.fromAmount) {
      const calculatedAmount = calculateSwapAmount(
        swapState.fromToken,
        swapState.toToken,
        swapState.fromAmount
      );
      setSwapState(prev => ({ ...prev, toAmount: calculatedAmount }));
    }
  }, [swapState.fromToken, swapState.toToken, swapState.fromAmount]);
  
  // Monitor transaction status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = getCurrentTransactionStatus();
      if (status !== txStatus) {
        setTxStatus(status);
        
        if (status === 'success') {
          setIsSwapping(false);
          // Reset form after successful swap with a delay
          setTimeout(() => {
            setSwapState(prev => ({
              ...prev,
              fromAmount: '',
              toAmount: '',
            }));
            resetTransactionState();
            setTxStatus(null);
          }, 5000);
        } else if (status === 'error') {
          setIsSwapping(false);
          setTimeout(() => {
            resetTransactionState();
            setTxStatus(null);
          }, 5000);
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [txStatus]);
  
  // Handle swap action
  const handleSwap = async () => {
    if (!swapState.fromToken || !swapState.toToken || !swapState.fromAmount) {
      toast.error("Please select tokens and enter an amount to swap");
      return;
    }
    
    if (!isSwapAvailable(selectedNetwork.id)) {
      toast.error(`Swapping is not available on ${selectedNetwork.name} network`);
      return;
    }
    
    setIsSwapping(true);
    setTxStatus('pending');
    
    try {
      await executeContractSwap(
        swapState.fromToken,
        swapState.toToken,
        swapState.fromAmount,
        swapState.slippage,
        false // isTestnet
      );
      
      // Note: We don't set success here as the transaction is monitored via the useEffect
    } catch (error) {
      console.error("Swap error:", error);
      setIsSwapping(false);
      setTxStatus(null);
    }
  };
  
  // Switch tokens
  const handleSwitchTokens = () => {
    if (!swapState.fromToken || !swapState.toToken) return;
    
    setSwapState(prev => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      fromAmount: prev.toAmount,
      toAmount: prev.fromAmount,
    }));
  };
  
  return (
    <Card className="swap-card w-full max-w-[480px] mx-auto">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-6">
          <NetworkSelector 
            selectedNetwork={selectedNetwork} 
            onSelectNetwork={setSelectedNetwork} 
          />
          
          <Button
            variant="ghost"
            size="icon"
            className="settings-button"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 text-white/70" />
          </Button>
        </div>
        
        {showSettings && (
          <div className="bg-black/10 rounded-xl p-4 mb-6">
            <SlippageComponent
              slippage={swapState.slippage}
              setSlippage={(value) => setSwapState(prev => ({ ...prev, slippage: value }))}
              slippageOptions={SLIPPAGE_OPTIONS}
            />
          </div>
        )}
        
        <div className="space-y-2">
          <SwapInput
            label="From"
            selectedToken={swapState.fromToken}
            onSelectToken={(token) => 
              setSwapState(prev => ({ ...prev, fromToken: token }))
            }
            amount={swapState.fromAmount}
            onAmountChange={(amount) => 
              setSwapState(prev => ({ ...prev, fromAmount: amount }))
            }
            availableTokens={availableTokens}
            isLoading={isLoadingTokens}
          />
          
          <div className="flex justify-center -my-3 relative z-10">
            <button 
              onClick={handleSwitchTokens}
              className="swap-connector"
              disabled={!swapState.fromToken || !swapState.toToken}
            >
              <ArrowDownUp className="h-4 w-4" />
            </button>
          </div>
          
          <SwapInput
            label="To"
            selectedToken={swapState.toToken}
            onSelectToken={(token) => 
              setSwapState(prev => ({ ...prev, toToken: token }))
            }
            amount={swapState.toAmount}
            onAmountChange={(amount) => 
              setSwapState(prev => ({ ...prev, toAmount: amount }))
            }
            availableTokens={availableTokens}
            isLoading={isLoadingTokens}
            isReadOnly={true}
          />
        </div>
        
        <div className="mt-6">
          <Button 
            className="w-full py-6 text-lg font-medium"
            disabled={!swapState.fromToken || !swapState.toToken || !swapState.fromAmount || isSwapping}
            onClick={isConnected ? handleSwap : () => {
              // Show wallet dialog if not connected
              if (selectedWallet) {
                connect(selectedWallet);
              } else {
                toast.info("Please connect a wallet first");
              }
            }}
          >
            {!isConnected 
              ? "Connect Wallet" 
              : isSwapping 
                ? "Swapping..." 
                : txStatus === 'success' 
                  ? "Swap Successful" 
                  : "Swap"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Swap;
