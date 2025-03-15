
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SlippageComponentProps {
  slippage: number;
  setSlippage: (slippage: number) => void;
  slippageOptions: number[];
}

const SlippageComponent = ({ 
  slippage, 
  setSlippage, 
  slippageOptions 
}: SlippageComponentProps) => {
  const [customSlippage, setCustomSlippage] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  
  const handlePresetSelection = (value: number) => {
    setSlippage(value);
    setIsCustom(false);
  };
  
  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow only numbers and decimals
    if (value === '' || /^[0-9]*[.]?[0-9]*$/.test(value)) {
      setCustomSlippage(value);
      
      if (value && !isNaN(parseFloat(value))) {
        setSlippage(parseFloat(value));
      }
    }
  };

  const handleCustomFocus = () => {
    setIsCustom(true);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="slippage" className="text-white">Slippage Tolerance</Label>
        <div className="text-xs text-white/60 mt-1">
          Your transaction will revert if the price changes unfavorably by more than this percentage.
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {slippageOptions.map((option) => (
          <Button
            key={option}
            variant={!isCustom && slippage === option ? "default" : "outline"}
            className={!isCustom && slippage === option ? "bg-unikron-blue" : "bg-black/20 border-unikron-blue/20 text-white"}
            onClick={() => handlePresetSelection(option)}
          >
            {option}%
          </Button>
        ))}
        
        <div className="relative min-w-20">
          <Input
            id="custom-slippage"
            value={isCustom ? customSlippage : ""}
            onChange={handleCustomInputChange}
            onFocus={handleCustomFocus}
            placeholder="Custom"
            className={`bg-black/20 border-unikron-blue/20 text-white ${isCustom ? 'border-unikron-blue' : ''}`}
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60">%</span>
        </div>
      </div>
      
      {(isCustom && parseFloat(customSlippage) > 5) && (
        <div className="text-amber-500 text-xs">
          High slippage values can result in a poor rate due to price impact and MEV.
        </div>
      )}
    </div>
  );
};

export default SlippageComponent;
