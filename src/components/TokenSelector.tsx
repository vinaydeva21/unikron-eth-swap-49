
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { TOKENS, Token } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TokenSelectorProps {
  selectedToken: Token | null;
  onSelectToken: (token: Token) => void;
  label: string;
}

const TokenSelector = ({
  selectedToken,
  onSelectToken,
  label,
}: TokenSelectorProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="token-selector" asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 border border-unikron-blue/10 outline-none">
          {selectedToken ? (
            <>
              <img 
                src={selectedToken.icon} 
                alt={selectedToken.symbol} 
                className="h-6 w-6 rounded-full" 
              />
              <span className="text-white font-medium">{selectedToken.symbol}</span>
              <ChevronDown className="h-4 w-4 text-white/70" />
            </>
          ) : (
            <>
              <span className="text-white font-medium">Select Token</span>
              <ChevronDown className="h-4 w-4 text-white/70" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-unikron-navy-light border border-unikron-blue/20 backdrop-blur-xl shadow-xl animate-fadeIn w-[220px]">
        {TOKENS.map((token) => (
          <DropdownMenuItem
            key={token.id}
            className="flex items-center gap-2 px-3 py-2 hover:bg-unikron-blue/10 cursor-pointer transition-all duration-300"
            onClick={() => onSelectToken(token)}
          >
            <img 
              src={token.icon} 
              alt={token.symbol} 
              className="h-6 w-6 rounded-full" 
            />
            <div className="flex flex-col items-start">
              <span className="text-white font-medium">{token.symbol}</span>
              <span className="text-white/60 text-xs">{token.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TokenSelector;
