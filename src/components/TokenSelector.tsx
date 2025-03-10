import { useState } from "react";
import { ChevronDown, Search, Loader2 } from "lucide-react";
import { Token } from "@/lib/types";
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
  availableTokens: Token[];
}

const TokenSelector = ({
  selectedToken,
  onSelectToken,
  label,
  availableTokens,
}: TokenSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter tokens based on search query
  const filteredTokens = availableTokens.filter(token => 
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="token-selector" asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 border border-unikron-blue/10 outline-none min-w-[120px] whitespace-nowrap">
          {selectedToken ? (
            <>
              <img 
                src={selectedToken.icon} 
                alt={selectedToken.symbol} 
                className="h-6 w-6 rounded-full" 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/tokens/unknown.svg";
                }}
              />
              <span className="text-white font-medium truncate">{selectedToken.symbol}</span>
              <ChevronDown className="h-4 w-4 text-white/70 flex-shrink-0" />
            </>
          ) : (
            <span className="text-white font-medium truncate">Select Token</span>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="bg-unikron-navy-light border border-unikron-blue/20 backdrop-blur-xl shadow-xl animate-fadeIn w-[300px] max-h-[450px] p-0 overflow-hidden">
        <div className="p-3 border-b border-unikron-blue/10">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              type="text"
              placeholder="Search token"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-unikron-blue/10 rounded-lg py-2 pl-8 pr-3 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-unikron-blue"
            />
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[350px] scrollbar-thin scrollbar-thumb-unikron-blue/20 scrollbar-track-transparent">
          {filteredTokens.length > 0 ? (
            filteredTokens.map((token) => (
              <DropdownMenuItem
                key={token.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-unikron-blue/10 cursor-pointer transition-all duration-300"
                onClick={() => {
                  onSelectToken(token);
                  setSearchQuery("");
                }}
              >
                <img 
                  src={token.icon} 
                  alt={token.symbol} 
                  className="h-6 w-6 rounded-full" 
                  onError={(e) => {
                    // If image fails to load, use a fallback
                    (e.target as HTMLImageElement).src = "/tokens/unknown.svg";
                  }}
                />
                <div className="flex flex-col items-start">
                  <span className="text-white font-medium">{token.symbol}</span>
                  <span className="text-white/60 text-xs">{token.name}</span>
                </div>
                
                {token.price > 0 && (
                  <span className="ml-auto text-right text-white/70 text-sm">${token.price.toFixed(2)}</span>
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-white/50">
              {availableTokens.length === 0 ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-6 w-6 animate-spin mb-2" />
                  <span>Loading tokens...</span>
                </div>
              ) : (
                <span>No tokens found</span>
              )}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TokenSelector;
