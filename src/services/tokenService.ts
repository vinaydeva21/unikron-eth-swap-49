
import { Token, Network } from '@/lib/types';
import { NETWORKS } from '@/lib/constants';

const SYMBIOSIS_API_BASE = 'https://api-v2.symbiosis.finance/crosschain';

interface SymbiosisToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainId: number;
  icon?: string;
  logoURI?: string;
}

interface SymbiosisPriceResponse {
  [address: string]: {
    usd: number;
  };
}

/**
 * Fetches tokens for a specific network from Symbiosis API
 */
export const fetchSymbiosisTokens = async (networkId: string): Promise<Token[]> => {
  try {
    // Map network IDs to chain IDs
    const network = NETWORKS.find(net => net.id === networkId);
    if (!network?.chainId) {
      console.log(`No chainId mapping for network: ${networkId}`);
      return [];
    }
    
    const chainId = network.chainId;
    
    const response = await fetch(`${SYMBIOSIS_API_BASE}/v1/tokens?chainId=${chainId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // The API returns an array of tokens directly
    const tokens = Array.isArray(data) ? data : [];
    
    // Now fetch prices for all tokens
    const tokenAddresses = tokens.map((token: SymbiosisToken) => token.address);
    const pricesData = await fetchTokenPrices(tokenAddresses, chainId);
    
    // Map the Symbiosis tokens to our application Token type
    return tokens.map((token: SymbiosisToken) => ({
      id: `${networkId}-${token.address}`,
      symbol: token.symbol,
      name: token.name,
      icon: token.icon || token.logoURI || `/tokens/${token.symbol.toLowerCase()}.svg`,
      decimals: token.decimals,
      network: networkId,
      chainId: token.chainId,
      address: token.address,
      price: pricesData[token.address.toLowerCase()]?.usd || 0,
    }));
  } catch (error) {
    console.error('Error fetching Symbiosis tokens:', error);
    return [];
  }
};

/**
 * Fetches prices for multiple tokens at once
 */
const fetchTokenPrices = async (addresses: string[], chainId: number): Promise<SymbiosisPriceResponse> => {
  try {
    if (!addresses.length) return {};
    
    const addressesQuery = addresses.join(',');
    const response = await fetch(`${SYMBIOSIS_API_BASE}/v1/prices?chainId=${chainId}&addresses=${addressesQuery}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token prices: ${response.statusText}`);
    }
    
    return await response.json() as SymbiosisPriceResponse;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    return {};
  }
};

/**
 * Connect to Ethereum wallet using MetaMask or other providers
 */
export const connectWallet = async (): Promise<boolean> => {
  try {
    // Check if Ethereum provider exists (MetaMask, etc.)
    if (window.ethereum) {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Check if we have at least one account
      return accounts && accounts.length > 0;
    } else {
      console.error('No Ethereum provider detected. Please install MetaMask or another wallet.');
      return false;
    }
  } catch (error) {
    console.error('Error connecting to Ethereum wallet:', error);
    return false;
  }
};

/**
 * Calculate swap amount based on token prices
 */
export const calculateSwapAmount = (
  fromToken: Token | null, 
  toToken: Token | null, 
  amount: string
): string => {
  if (!fromToken || !toToken || !amount || parseFloat(amount) === 0 || !fromToken.price || !toToken.price) {
    return '';
  }
  
  // Calculate the amount based on USD values
  const fromUsdValue = parseFloat(amount) * fromToken.price;
  const toAmount = fromUsdValue / toToken.price;
  
  // Format the result to 6 decimal places
  return toAmount.toFixed(6);
};
