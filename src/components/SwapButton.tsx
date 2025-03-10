
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Token } from "@/lib/constants";

interface SwapButtonProps {
  connected: boolean;
  onConnect: () => void;
  onSwap: () => void;
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
}

const SwapButton = ({
  connected,
  onConnect,
  onSwap,
  fromToken,
  toToken,
  fromAmount,
}: SwapButtonProps) => {
  const isDisabled = !fromToken || !toToken || !fromAmount || fromAmount === '0';
  
  if (!connected) {
    return (
      <button 
        className="connect-button w-full"
        onClick={onConnect}
      >
        <Wallet className="h-5 w-5 mr-2" />
        Connect wallet
      </button>
    );
  }
  
  let buttonText = 'Swap';
  
  if (!fromToken || !toToken) {
    buttonText = 'Select tokens';
  } else if (!fromAmount || fromAmount === '0') {
    buttonText = 'Enter an amount';
  }
  
  return (
    <button 
      disabled={isDisabled}
      className={`connect-button w-full ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onSwap}
    >
      {buttonText}
    </button>
  );
};

export default SwapButton;
