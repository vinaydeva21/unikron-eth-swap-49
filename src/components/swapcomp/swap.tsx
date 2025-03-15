
import { useState, useEffect } from "react";
import { ArrowDownUp, Settings } from "lucide-react";
import { NETWORKS, SLIPPAGE_OPTIONS } from "@/lib/constants";
import { Network, Token, SwapState } from "@/lib/types";
import NetworkSelector from "@/components/NetworkSelector";
import SwapInput from "@/components/swapcomp/swapInput";
import SlippageComponent from "@/components/swapcomp/slippage_component";
import { useWallet } from "@/context/walletContext";
import { useNetwork } from "@/context/networkContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fetchSymbiosisTokens, calculateSwapAmount } from "@/services/tokenService";
import { executeSymbiosisSwap, getSwapQuote, isTokenPairSupported } from "@/services/symbiosisService";
import { toast } from "sonner";

const Swap = () => {
  const { isConnected, connect, selectedWallet, address } = useWallet();
  const { isTestnet } = useNetwork();
  
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
  const [isPairSupported, setIsPairSupported] = useState(true);
  
  // Load tokens when network changes or testnet toggle changes
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
        
        toast.info(`Switched to ${isTestnet ? 'Sepolia testnet' : 'Ethereum mainnet'}`);
      } catch (error) {
        console.error("Error loading tokens:", error);
        toast.error("Failed to load tokens. Please try again later.");
      } finally {
        setIsLoadingTokens(false);
      }
    };
    
    loadTokens();
  }, [selectedNetwork, isTestnet]);
  
  // Check token pair support when tokens change
  useEffect(() => {
    const checkPairSupport = async () => {
      if (swapState.fromToken && swapState.toToken) {
        const supported = await isTokenPairSupported(
          swapState.fromToken,
          swapState.toToken,
          isTestnet
        );
        setIsPairSupported(supported);
        
        if (!supported) {
          toast.warning(`This token pair is not supported for swapping via Symbiosis`);
        }
      }
    };
    
    checkPairSupport();
  }, [swapState.fromToken, swapState.toToken, isTestnet]);
  
  // Get quote when parameters change
  useEffect(() => {
    const getQuote = async () => {
      if (swapState.fromToken && swapState.toToken && swapState.fromAmount && address && parseFloat(swapState.fromAmount) > 0) {
        try {
          const quote = await getSwapQuote(
            swapState.fromToken,
            swapState.toToken,
            swapState.fromAmount,
            address,
            isTestnet
          );
          
          if (quote) {
            // Format the output amount based on token decimals
            const formattedAmount = ethers.utils.formatUnits(
              quote.amountOut,
              swapState.toToken.decimals
            );
            setSwapState(prev => ({ ...prev, toAmount: formattedAmount }));
          }
        } catch (error) {
          console.error("Error getting swap quote:", error);
          // Fallback to calculation if API quote fails
          const calculatedAmount = calculateSwapAmount(
            swapState.fromToken,
            swapState.toToken,
            swapState.fromAmount
          );
          setSwapState(prev => ({ ...prev, toAmount: calculatedAmount }));
        }
      } else if (swapState.fromToken && swapState.toToken && swapState.fromAmount) {
        // Fallback to calculation if we're not connected
        const calculatedAmount = calculateSwapAmount(
          swapState.fromToken,
          swapState.toToken,
          swapState.fromAmount
        );
        setSwapState(prev => ({ ...prev, toAmount: calculatedAmount }));
      }
    };
    
    getQuote();
  }, [swapState.fromToken, swapState.toToken, swapState.fromAmount, address, isTestnet]);
  
  // Handle swap action
  const handleSwap = async () => {
    if (!swapState.fromToken || !swapState.toToken || !swapState.fromAmount) {
      toast.error("Please select tokens and enter an amount to swap");
      return;
    }
    
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!isPairSupported) {
      toast.error("This token pair is not supported for swapping");
      return;
    }
    
    setIsSwapping(true);
    setTxStatus('pending');
    
    try {
      const success = await executeSymbiosisSwap(
        swapState.fromToken,
        swapState.toToken,
        swapState.fromAmount,
        swapState.slippage,
        address,
        isTestnet
      );
      
      if (success) {
        setTxStatus('success');
        // Reset form after successful swap with a delay
        setTimeout(() => {
          setSwapState(prev => ({
            ...prev,
            fromAmount: '',
            toAmount: '',
          }));
          setTxStatus(null);
        }, 5000);
      } else {
        setTxStatus('error');
        setTimeout(() => {
          setTxStatus(null);
        }, 5000);
      }
    } catch (error) {
      console.error("Swap error:", error);
      setTxStatus('error');
      setTimeout(() => {
        setTxStatus(null);
      }, 5000);
    } finally {
      setIsSwapping(false);
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
          
          <div className="flex items-center gap-2">
            {isTestnet && (
              <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full">
                Sepolia
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="settings-button"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 text-white/70" />
            </Button>
          </div>
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
        
        {!isPairSupported && swapState.fromToken && swapState.toToken && (
          <div className="mt-4 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-yellow-300 text-sm">
            This token pair is not supported for swapping via Symbiosis
          </div>
        )}
        
        <div className="mt-6">
          <Button 
            className="w-full py-6 text-lg font-medium"
            disabled={!swapState.fromToken || !swapState.toToken || !swapState.fromAmount || isSwapping || (swapState.fromToken && swapState.toToken && !isPairSupported)}
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
                  : swapState.fromToken && swapState.toToken && !isPairSupported
                    ? "Pair Not Supported"
                    : "Swap"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Import ethers for blockchain interactions
import { ethers } from 'ethers';

export default Swap;
