
import { useState, useEffect } from "react";
import { ArrowDownUp, Settings, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

import { Network, Token, SwapState } from "@/lib/types";
import { NETWORKS, SLIPPAGE_OPTIONS } from "@/lib/constants";
import { useWallet } from "@/context/walletContext";
import { useNetwork } from "@/context/networkContext";
import { fetchSymbiosisTokens } from "@/services/tokenService";
import NetworkSelector from "@/components/NetworkSelector";
import SwapInput from "@/components/swapcomp/swapInput";
import SlippageComponent from "@/components/swapcomp/slippage_component";

import {
  getSymbiosisSwapQuote,
  executeSymbiosisSwap,
  isSymbiosisTokenPairSupported,
  getTokenBalance,
  approveTokenForSymbiosis
} from "@/lib/symbiosisSwap";

const SymbiosisSwap = () => {
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
  const [isApproving, setIsApproving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [txStatus, setTxStatus] = useState<'pending' | 'success' | 'error' | null>(null);
  const [isPairSupported, setIsPairSupported] = useState(true);
  const [swapProgress, setSwapProgress] = useState(0);
  const [isSpecialChain, setIsSpecialChain] = useState(false);
  
  // Load tokens when network changes or testnet toggle changes
  useEffect(() => {
    const loadTokens = async () => {
      setIsLoadingTokens(true);
      try {
        // Check if the selected network is a special network like Bitcoin or TON
        const isSpecial = selectedNetwork.id === 'bitcoin' || 
                         selectedNetwork.id === 'ton' ||
                         selectedNetwork.name.toLowerCase().includes('bitcoin') ||
                         selectedNetwork.name.toLowerCase().includes('ton');
        
        setIsSpecialChain(isSpecial);
        
        const tokens = await fetchSymbiosisTokens(selectedNetwork.id, isTestnet);
        setAvailableTokens(tokens);
        
        // Reset token selection if network changes
        setSwapState(prev => ({
          ...prev,
          fromToken: null,
          toToken: null,
          fromAmount: '',
          toAmount: '',
        }));
        
        if (isSpecial) {
          toast.info(`${selectedNetwork.name} integration requires a compatible wallet`);
        } else {
          toast.info(`Switched to ${isTestnet ? 'Testnet' : 'Mainnet'}`);
        }
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
        try {
          console.log("Checking support for pair:", {
            fromToken: `${swapState.fromToken.symbol} (${swapState.fromToken.chainId})`,
            toToken: `${swapState.toToken.symbol} (${swapState.toToken.chainId})`
          });
          
          const supported = await isSymbiosisTokenPairSupported(
            swapState.fromToken,
            swapState.toToken,
            isTestnet
          );
          
          console.log(`Pair support result: ${supported}`);
          setIsPairSupported(supported);
          
          if (!supported) {
            toast.warning(`This token pair is not supported for swapping via Symbiosis`);
          }
        } catch (error) {
          console.error("Error checking pair support:", error);
          setIsPairSupported(false);
        }
      }
    };
    
    checkPairSupport();
  }, [swapState.fromToken, swapState.toToken, isTestnet]);
  
  // Get quote when parameters change
  useEffect(() => {
    const getQuote = async () => {
      if (swapState.fromToken && swapState.toToken && swapState.fromAmount && 
          parseFloat(swapState.fromAmount) > 0) {
        try {
          console.log("Getting quote for:", {
            fromToken: swapState.fromToken.symbol,
            toToken: swapState.toToken.symbol,
            amount: swapState.fromAmount
          });
          
          // For special chains or if no wallet is connected, use a simplified calculation
          if (isSpecialChain || !address) {
            const fromPrice = swapState.fromToken.price || 1;
            const toPrice = swapState.toToken.price || 1;
            const inputAmount = parseFloat(swapState.fromAmount);
            const outputAmount = (inputAmount * fromPrice) / toPrice;
            
            setSwapState(prev => ({ 
              ...prev, 
              toAmount: outputAmount.toFixed(swapState.toToken.decimals || 6)
            }));
            
            console.log("Using price-based calculation:", {
              fromPrice,
              toPrice,
              result: outputAmount.toFixed(swapState.toToken.decimals || 6)
            });
            
            return;
          }
          
          // Get quote from Symbiosis API
          const quote = await getSymbiosisSwapQuote(
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
              swapState.toToken.decimals || 18
            );
            
            console.log("Quote received:", {
              amountOut: quote.amountOut,
              formatted: formattedAmount
            });
            
            setSwapState(prev => ({ ...prev, toAmount: formattedAmount }));
          } else {
            console.log("No quote received, using fallback calculation");
            // Fallback to price-based calculation
            const fromPrice = swapState.fromToken.price || 1;
            const toPrice = swapState.toToken.price || 1;
            const inputAmount = parseFloat(swapState.fromAmount);
            const outputAmount = (inputAmount * fromPrice) / toPrice;
            
            setSwapState(prev => ({ 
              ...prev, 
              toAmount: outputAmount.toFixed(swapState.toToken.decimals || 6)
            }));
          }
        } catch (error) {
          console.error("Error getting swap quote:", error);
          // Fallback to price-based calculation on error
          const fromPrice = swapState.fromToken.price || 1;
          const toPrice = swapState.toToken.price || 1;
          const inputAmount = parseFloat(swapState.fromAmount);
          const outputAmount = (inputAmount * fromPrice) / toPrice;
          
          setSwapState(prev => ({ 
            ...prev, 
            toAmount: outputAmount.toFixed(swapState.toToken.decimals || 6)
          }));
        }
      }
    };
    
    getQuote();
  }, [swapState.fromToken, swapState.toToken, swapState.fromAmount, address, isTestnet, isSpecialChain]);
  
  // Update progress bar during swapping
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
    
    // Special handling for BTC/TON chains
    if (isSpecialChain) {
      toast.info(`${swapState.fromToken.symbol} or ${swapState.toToken.symbol} swaps require specialized wallet integration`);
      toast.info("Please check the Symbiosis documentation for details on BTC and TON integration");
      return;
    }
    
    // Check if balance is sufficient
    try {
      const balance = await getTokenBalance(swapState.fromToken, address);
      if (parseFloat(balance) < parseFloat(swapState.fromAmount)) {
        toast.error(`Insufficient ${swapState.fromToken.symbol} balance`);
        return;
      }
    } catch (error) {
      console.error("Error checking balance:", error);
    }
    
    // For ERC20 tokens, approve first
    if (swapState.fromToken.address && 
        swapState.fromToken.address.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      setIsApproving(true);
      try {
        // In a real implementation, you would get the spender address from the Symbiosis quote
        const spenderAddress = "0x6571d6be3d8460CF5F7d6711Cd9961860029D05F"; // Example spender
        const approved = await approveTokenForSymbiosis(
          swapState.fromToken,
          spenderAddress,
          swapState.fromAmount,
          isTestnet
        );
        
        if (!approved) {
          setIsApproving(false);
          return;
        }
      } catch (error) {
        console.error("Error approving token:", error);
        toast.error(`Approval failed: ${(error as Error).message}`);
        setIsApproving(false);
        return;
      }
      setIsApproving(false);
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
                Testnet
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
        
        {/* Display warning for special chains like BTC and TON */}
        {isSpecialChain && (
          <div className="bg-blue-500/10 text-blue-300 p-3 rounded-xl mb-4 text-sm">
            <div className="font-semibold mb-1">
              {selectedNetwork.name} Integration Note:
            </div>
            <p>
              Symbiosis supports {selectedNetwork.name} swaps, but requires a compatible wallet.
              See the documentation for more details on integration.
            </p>
          </div>
        )}
        
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
        
        {(isSwapping || isApproving || txStatus === 'success' || txStatus === 'error') && (
          <div className="mt-4 mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-white/70">
                {isApproving 
                  ? 'Approving token...' 
                  : isSwapping 
                    ? 'Processing swap...' 
                    : txStatus === 'success' 
                      ? 'Swap completed' 
                      : 'Swap failed'}
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
        
        <div className="mt-6">
          <Button 
            className="w-full py-6 text-lg font-medium"
            disabled={
              !swapState.fromToken || 
              !swapState.toToken || 
              !swapState.fromAmount || 
              isSwapping || 
              isApproving || 
              (swapState.fromToken && swapState.toToken && !isPairSupported)
            }
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
              : isApproving
                ? "Approving..."
                : isSwapping 
                  ? "Swapping..." 
                  : txStatus === 'success' 
                    ? "Swap Successful" 
                    : txStatus === 'error'
                      ? "Swap Failed"
                      : swapState.fromToken && swapState.toToken && !isPairSupported
                        ? "Pair Not Supported"
                        : isSpecialChain
                          ? `View ${selectedNetwork.name} Documentation`
                          : "Swap"}
          </Button>
        </div>
        
        {swapState.fromToken && swapState.toToken && swapState.fromAmount && swapState.toAmount && (
          <div className="mt-4 p-3 bg-black/10 rounded-xl text-sm text-white/70">
            <div className="flex justify-between mb-1">
              <span>Rate</span>
              <span>
                1 {swapState.fromToken.symbol} ≈ {
                  parseFloat(swapState.fromAmount) > 0
                    ? (parseFloat(swapState.toAmount) / parseFloat(swapState.fromAmount)).toFixed(6)
                    : '0'
                } {swapState.toToken.symbol}
              </span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Network</span>
              <span className="text-unikron-blue">
                {selectedNetwork.name} {isTestnet ? '(Testnet)' : '(Mainnet)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Slippage</span>
              <span>{swapState.slippage}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Import ethers for blockchain interactions
import { ethers } from 'ethers';

export default SymbiosisSwap;
