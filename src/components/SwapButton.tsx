
import { Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Token } from "@/lib/types";
import { useState } from "react";

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
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  
  const isDisabled = !fromToken || !toToken || !fromAmount || fromAmount === '0';
  
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await onConnect();
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleSwap = async () => {
    setIsSwapping(true);
    try {
      await onSwap();
    } finally {
      setIsSwapping(false);
    }
  };
  
  if (!connected) {
    return (
      <button 
        className="connect-button w-full flex items-center justify-center"
        onClick={handleConnect}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="h-5 w-5 mr-2" />
            Connect wallet
          </>
        )}
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
      disabled={isDisabled || isSwapping}
      className={`connect-button w-full flex items-center justify-center ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleSwap}
    >
      {isSwapping ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Swapping...
        </>
      ) : (
        buttonText
      )}
    </button>
  );
};

export default SwapButton;
