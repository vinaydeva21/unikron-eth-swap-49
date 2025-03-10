
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
    let pricesData = {};
    
    try {
      pricesData = await fetchTokenPrices(tokenAddresses, chainId);
      console.log('Successfully fetched token prices:', Object.keys(pricesData).length);
    } catch (error) {
      console.error('Error fetching token prices, using fallback prices:', error);
      // Use fallback prices for demo purposes
      pricesData = createFallbackPrices(tokens);
    }
    
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
 * Creates fallback prices for tokens when API fails
 */
const createFallbackPrices = (tokens: SymbiosisToken[]): SymbiosisPriceResponse => {
  const fallbackPrices: SymbiosisPriceResponse = {};
  
  // Common tokens with approximate prices
  const knownPrices: {[symbol: string]: number} = {
    'ETH': 3500,
    'WETH': 3500,
    'USDT': 1,
    'USDC': 1,
    'DAI': 1,
    'WBTC': 65000,
    'BNB': 580,
    'MATIC': 0.8,
    'UNI': 8,
    'LINK': 15,
    'AAVE': 100,
    'MKR': 2000,
    'CRV': 0.5,
    'COMP': 45,
    'SNX': 3.5,
    'YFI': 7500,
    'SUSHI': 1.2,
  };
  
  tokens.forEach((token: SymbiosisToken) => {
    const price = knownPrices[token.symbol] || Math.random() * 10; // Random price for unknown tokens
    fallbackPrices[token.address.toLowerCase()] = { usd: price };
  });
  
  return fallbackPrices;
};

/**
 * Fetches prices for multiple tokens at once
 */
const fetchTokenPrices = async (addresses: string[], chainId: number): Promise<SymbiosisPriceResponse> => {
  try {
    if (!addresses.length) return {};
    
    // Take only first 100 addresses to avoid very long URL
    const addressesToFetch = addresses.slice(0, 100);
    const addressesQuery = addressesToFetch.join(',');
    const url = `${SYMBIOSIS_API_BASE}/v1/prices?chainId=${chainId}&addresses=${addressesQuery}`;
    
    console.log(`Fetching prices for ${addressesToFetch.length} tokens from ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token prices: ${response.statusText}`);
    }
    
    return await response.json() as SymbiosisPriceResponse;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    throw error; // Re-throw to handle with fallback
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
  console.log("Calculating swap amount:", { 
    fromToken: fromToken?.symbol, 
    toToken: toToken?.symbol, 
    amount, 
    fromPrice: fromToken?.price,
    toPrice: toToken?.price
  });
  
  if (!fromToken || !toToken || !amount || amount === '' || parseFloat(amount) === 0) {
    console.log("Returning empty string - missing data");
    return '';
  }
  
  // If prices are missing or zero, use default values for demo purposes
  const fromPrice = fromToken.price || 1;
  const toPrice = toToken.price || 1;
  
  if (fromPrice <= 0 || toPrice <= 0) {
    console.log("Invalid prices:", { fromPrice, toPrice });
    return '';
  }
  
  // Calculate the amount based on USD values
  const fromUsdValue = parseFloat(amount) * fromPrice;
  const toAmount = fromUsdValue / toPrice;
  
  console.log("Calculation result:", { 
    fromUsdValue, 
    toAmount, 
    result: toAmount.toFixed(6) 
  });
  
  // Format the result to 6 decimal places
  return toAmount.toFixed(6);
};
