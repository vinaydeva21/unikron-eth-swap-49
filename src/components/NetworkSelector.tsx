
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { NETWORKS } from "@/lib/constants";
import { Network } from "@/lib/types";
import { useNetwork } from "@/context/networkContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NetworkSelectorProps {
  onSelectNetwork?: (network: Network) => void;
  selectedNetwork?: Network;
}

const NetworkSelector = ({ onSelectNetwork, selectedNetwork: propSelectedNetwork }: NetworkSelectorProps) => {
  const { selectedNetwork: contextSelectedNetwork, setSelectedNetwork } = useNetwork();
  
  // Use prop value if provided, otherwise use context value
  const displayNetwork = propSelectedNetwork || contextSelectedNetwork;
  
  const handleNetworkSelect = (network: Network) => {
    setSelectedNetwork(network);
    if (onSelectNetwork) {
      onSelectNetwork(network);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="network-selector" asChild>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 border border-unikron-blue/10 outline-none">
          <div className="flex items-center gap-2">
            <img 
              src={displayNetwork?.icon || NETWORKS[0].icon} 
              alt={displayNetwork?.name || NETWORKS[0].name} 
              className="h-5 w-5 rounded-full" 
            />
            <span className="text-white font-medium">{displayNetwork?.name || NETWORKS[0].name}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-white/70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-unikron-navy-light border border-unikron-blue/20 backdrop-blur-xl shadow-xl animate-fadeIn">
        {NETWORKS.map((network) => (
          <DropdownMenuItem
            key={network.id}
            className="flex items-center gap-2 px-3 py-2 hover:bg-unikron-blue/10 cursor-pointer transition-all duration-300"
            onClick={() => handleNetworkSelect(network)}
          >
            <img 
              src={network.icon} 
              alt={network.name} 
              className="h-5 w-5 rounded-full" 
            />
            <span className="text-white">{network.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NetworkSelector;
