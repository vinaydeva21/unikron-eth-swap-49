
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Token } from "@/lib/types";
import TokenSelector from "@/components/swapcomp/tokens";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

interface SwapInputProps {
  label: string;
  selectedToken: Token | null;
  onSelectToken: (token: Token) => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  availableTokens: Token[];
  isLoading?: boolean;
  isReadOnly?: boolean;
}

const SwapInput = ({
  label,
  selectedToken,
  onSelectToken,
  amount,
  onAmountChange,
  availableTokens,
  isLoading = false,
  isReadOnly = false,
}: SwapInputProps) => {
  const isMobile = useIsMobile();
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Validate input to allow only numbers and decimals
    if (value === '' || /^[0-9]*[.]?[0-9]*$/.test(value)) {
      onAmountChange(value);
    }
  };
  
  // Format the display value for USD amount
  const getUsdValue = () => {
    if (!selectedToken || !selectedToken.price || !amount || parseFloat(amount) === 0) {
      return '$0.00';
    }
    
    const value = parseFloat(amount) * selectedToken.price;
    return `$${value.toLocaleString('en-US', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="rounded-xl overflow-hidden bg-black/20 border border-white/5">
      <div className="px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center">
        <span className="text-xs sm:text-sm text-white/60">{label}</span>
        <div className="text-xs sm:text-sm text-white/60">
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              <span>Loading...</span>
            </div>
          ) : (
            selectedToken && amount ? getUsdValue() : null
          )}
        </div>
      </div>
      
      <div className="px-3 sm:px-4 pb-2 sm:pb-3 flex justify-between items-center">
        <input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          placeholder="0"
          className="swap-input text-white"
          readOnly={isReadOnly}
        />
        
        <TokenSelector
          selectedToken={selectedToken}
          onSelectToken={onSelectToken}
          label={label}
          availableTokens={availableTokens}
        />
      </div>
    </div>
  );
};

export default SwapInput;
