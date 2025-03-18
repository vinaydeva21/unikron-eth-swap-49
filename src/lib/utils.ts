import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the block explorer URL for a transaction
 * @param chainId The chain ID
 * @param txHash The transaction hash
 * @param isTestnet Whether to use testnet explorers
 */
export function getExplorerUrl(chainId?: number, txHash?: string, isTestnet: boolean = false): string {
  if (!chainId || !txHash) {
    return '#';
  }
  
  // Define block explorers for different networks
  const explorers: Record<number, string> = {
    // Ethereum
    1: 'https://etherscan.io/tx/',
    5: 'https://goerli.etherscan.io/tx/', // Goerli testnet
    11155111: 'https://sepolia.etherscan.io/tx/', // Sepolia testnet
    
    // Arbitrum
    42161: 'https://arbiscan.io/tx/',
    421613: 'https://goerli.arbiscan.io/tx/', // Arbitrum Goerli
    421614: 'https://sepolia.arbiscan.io/tx/', // Arbitrum Sepolia
    
    // Cardano (Placeholder, as it would need a different format)
    // For Cardano we would use something like https://cardanoscan.io/transaction/
    1000: 'https://cardanoscan.io/transaction/',
    1001: 'https://preprod.cardanoscan.io/transaction/', // Preprod testnet
  };
  
  // Use mainnet explorer by default
  let explorerUrl = explorers[chainId] || 'https://etherscan.io/tx/';
  
  // If testnet is requested but we don't have a specific testnet explorer for this chain,
  // default to a testnet explorer based on chain type
  if (isTestnet && !explorerUrl.includes('goerli') && !explorerUrl.includes('sepolia') && !explorerUrl.includes('preprod')) {
    if (chainId === 1) {
      explorerUrl = explorers[11155111]; // Use Sepolia for Ethereum testnet
    } else if (chainId === 42161) {
      explorerUrl = explorers[421614]; // Use Sepolia for Arbitrum testnet
    } else if (chainId === 1000) {
      explorerUrl = explorers[1001]; // Use Preprod for Cardano testnet
    }
  }
  
  return `${explorerUrl}${txHash}`;
}
