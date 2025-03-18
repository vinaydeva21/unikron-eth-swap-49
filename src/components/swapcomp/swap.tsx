
import { useState, useEffect } from "react";
import { ArrowDownUp, Settings } from "lucide-react";
import { NETWORKS, SLIPPAGE_OPTIONS } from "@/lib/constants";
import { Network, Token, SwapState, Transaction } from "@/types"; // Updated import path
import NetworkSelector from "@/components/NetworkSelector";
import SwapInput from "@/components/swapcomp/swapInput";
import SlippageComponent from "@/components/swapcomp/slippage_component";
import TransactionHistory from "@/components/swapcomp/TransactionHistory";
import { useWallet } from "@/context/walletContext";
import { useNetwork } from "@/context/networkContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fetchSymbiosisTokens } from "@/services/tokenService";
import { swapTokens, calculateOutputAmount } from "@/lib/swap";
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
  
  // Transaction history state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Load saved transactions from localStorage on component mount
  useEffect(() => {
    const loadTransactions = () => {
      if (!address) return;
      
      try {
        const savedTransactions = localStorage.getItem(`transactions_${address}`);
        if (savedTransactions) {
          setTransactions(JSON.parse(savedTransactions));
        }
      } catch (error) {
        console.error("Error loading transactions:", error);
      }
    };
    
    loadTransactions();
  }, [address]);
  
  // Save transactions to localStorage when they change
  useEffect(() => {
    if (!address || transactions.length === 0) return;
    
    try {
      localStorage.setItem(`transactions_${address}`, JSON.stringify(transactions));
    } catch (error) {
      console.error("Error saving transactions:", error);
    }
  }, [transactions, address]);
  
  // Load tokens when network changes or testnet toggle changes
  useEffect(() => {
    const loadTokens = async () => {
      setIsLoadingTokens(true);
      try {
        console.log(`Loading tokens for network: ${selectedNetwork.id}, testnet: ${isTestnet}`);
        const tokens = await fetchSymbiosisTokens(selectedNetwork.id, isTestnet);
        console.log(`Loaded ${tokens.length} tokens`);
        setAvailableTokens(tokens);
        
        // Reset token selection if network changes
        setSwapState(prev => ({
          ...prev,
          fromToken: null,
          toToken: null,
          fromAmount: '',
          toAmount: '',
        }));
        
        toast.info(`Switched to ${isTestnet ? 'Testnet' : 'Mainnet'} on ${selectedNetwork.name}`);
      } catch (error) {
        console.error("Error loading tokens:", error);
        toast.error("Failed to load tokens. Please try again later.");
      } finally {
        setIsLoadingTokens(false);
      }
    };
    
    loadTokens();
  }, [selectedNetwork, isTestnet]);
  
  // Get quote when parameters change
  useEffect(() => {
    const getQuote = async () => {
      if (swapState.fromToken && swapState.toToken && swapState.fromAmount && parseFloat(swapState.fromAmount) > 0) {
        try {
          console.log("Getting quote for:", {
            fromToken: `${swapState.fromToken.symbol} (${swapState.fromToken.chainId})`,
            toToken: `${swapState.toToken.symbol} (${swapState.toToken.chainId})`,
            amount: swapState.fromAmount
          });
          
          const calculatedAmount = await calculateOutputAmount(
            swapState.fromToken,
            swapState.toToken,
            swapState.fromAmount,
            address,
            isTestnet
          );
          
          console.log(`Calculated output amount: ${calculatedAmount}`);
          setSwapState(prev => ({ ...prev, toAmount: calculatedAmount }));
          
          // We always assume the pair is supported since we have fallback mechanisms
          setIsPairSupported(true);
        } catch (error) {
          console.error("Error getting swap quote:", error);
          
          // Check if the error is specifically about pair not being supported
          const errorMsg = (error as Error).message || '';
          if (errorMsg.includes('not supported')) {
            setIsPairSupported(false);
            toast.error("This token pair is not supported for swapping");
          } else {
            // For other errors, show a toast but still allow the swap (will use fallback)
            toast.error(`Quote error: ${errorMsg}`);
            setIsPairSupported(true);
          }
          
          // Still try to provide a fallback calculation
          if (swapState.fromToken.price && swapState.toToken.price) {
            const fromPrice = swapState.fromToken.price || 1;
            const toPrice = swapState.toToken.price || 1;
            const inputAmount = parseFloat(swapState.fromAmount);
            const outputAmount = (inputAmount * fromPrice) / toPrice;
            
            setSwapState(prev => ({ 
              ...prev, 
              toAmount: outputAmount.toFixed(swapState.toToken.decimals || 6)
            }));
          } else {
            setSwapState(prev => ({ ...prev, toAmount: '0' }));
          }
        }
      } else if (!swapState.fromAmount || parseFloat(swapState.fromAmount) <= 0) {
        setSwapState(prev => ({ ...prev, toAmount: '' }));
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
    
    setIsSwapping(true);
    setTxStatus('pending');
    
    // Create a new transaction record
    const newTx: Transaction = {
      hash: "0x" + Math.random().toString(16).substring(2, 16) + Math.random().toString(16).substring(2, 16),
      status: 'pending',
      timestamp: Date.now(),
      type: 'swap',
      data: {
        fromToken: swapState.fromToken.symbol,
        toToken: swapState.toToken.symbol,
        fromAmount: swapState.fromAmount,
        toAmount: swapState.toAmount,
        chainId: swapState.fromToken.chainId || selectedNetwork.chainId
      }
    };
    
    // Add the transaction to history
    setTransactions(prev => [newTx, ...prev].slice(0, 20)); // Keep only the 20 most recent transactions
    
    try {
      const success = await swapTokens(
        swapState.fromToken,
        swapState.toToken,
        swapState.fromAmount,
        swapState.slippage,
        address,
        isTestnet
      );
      
      // Update transaction status
      setTransactions(prev => 
        prev.map(tx => tx.hash === newTx.hash 
          ? { ...tx, status: success ? 'success' : 'error' } 
          : tx
        )
      );
      
      setTxStatus(success ? 'success' : 'error');
      
      // Reset form after successful swap with a delay
      if (success) {
        setTimeout(() => {
          setSwapState(prev => ({
            ...prev,
            fromAmount: '',
            toAmount: '',
          }));
          setTxStatus(null);
        }, 5000);
      } else {
        setTimeout(() => {
          setTxStatus(null);
        }, 5000);
      }
    } catch (error) {
      console.error("Swap error:", error);
      
      // Update transaction status to error
      setTransactions(prev => 
        prev.map(tx => tx.hash === newTx.hash 
          ? { ...tx, status: 'error' } 
          : tx
        )
      );
      
      setTxStatus('error');
      toast.error(`Swap failed: ${(error as Error).message}`);
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
    <div className="space-y-4 w-full max-w-[480px] mx-auto">
      <Card className="swap-card w-full">
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
              This token pair may not be supported for swapping via Symbiosis, but we'll try a fallback method.
            </div>
          )}
          
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
      
      {isConnected && (
        <TransactionHistory transactions={transactions} />
      )}
    </div>
  );
};

export default Swap;
