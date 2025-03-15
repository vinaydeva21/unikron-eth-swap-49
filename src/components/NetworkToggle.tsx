
import { Switch } from "@/components/ui/switch";
import { useNetwork } from "@/context/networkContext";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Zap } from "lucide-react";

const NetworkToggle = () => {
  const { isTestnet, toggleTestnet } = useNetwork();

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-2">
              <Switch id="network-mode" checked={isTestnet} onCheckedChange={toggleTestnet} />
              <Label htmlFor="network-mode" className="text-sm text-white/80 cursor-pointer flex items-center">
                {isTestnet ? (
                  <span className="flex items-center">
                    Testnet <Zap className="h-3 w-3 ml-1 text-yellow-400" />
                  </span>
                ) : (
                  <span>Mainnet</span>
                )}
              </Label>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Switch between Mainnet and Testnet (Sepolia)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default NetworkToggle;
