
import { Token } from '@/lib/types';
import { toast } from 'sonner';

// Symbiosis API base URLs
const SYMBIOSIS_API_BASE = 'https://api-v2.symbiosis.finance/crosschain';
const SYMBIOSIS_TESTNET_API_BASE = 'https://api.testnet.symbiosis.finance/crosschain';

// Interface for swap request
interface SwapRequest {
  fromTokenAddress: string;
  toTokenAddress: string;
  fromTokenChainId: number;
  toTokenChainId: number;
  fromAmount: string;
  slippage: number;
  sender: string;
  recipient: string;
}

// Interface for swap response
interface SwapResponse {
  swapId: string;
  tx: {
    to: string;
    data: string;
    value: string;
    gasLimit: string;
  };
  amountOut: {
    amount: string;
    tokenAddress: string;
    tokenSymbol: string;
    tokenDecimals: number;
  };
  priceImpact: string;
  transactionFee: {
    amount: string;
    tokenSymbol: string;
    tokenDecimals: number;
    usdValue: string;
  };
  route: any[];
}

/**
 * Get the correct API base URL based on environment
 */
const getApiBaseUrl = (isTestnet: boolean): string => {
  return isTestnet ? SYMBIOSIS_TESTNET_API_BASE : SYMBIOSIS_API_BASE;
};

/**
 * Get swap quote from Symbiosis API
 */
export const getSwapQuote = async (
  fromToken: Token,
  toToken: Token,
  amount: string,
  walletAddress: string,
  isTestnet: boolean = false
): Promise<{ amountOut: string; swapData: any } | null> => {
  try {
    if (!fromToken.address || !toToken.address || !amount || !walletAddress) {
      console.error('Missing parameters for swap quote');
      return null;
    }

    console.log('Getting swap quote with parameters:', {
      fromToken: `${fromToken.symbol} (${fromToken.chainId})`,
      toToken: `${toToken.symbol} (${toToken.chainId})`,
      amount,
      walletAddress: walletAddress.substring(0, 6) + '...'
    });

    const baseUrl = getApiBaseUrl(isTestnet);
    const url = `${baseUrl}/v1/swap/quote`;

    const fromChainId = fromToken.chainId || 1; // Default to Ethereum Mainnet
    const toChainId = toToken.chainId || 1;

    // Convert amount to proper units based on token decimals
    let fromAmount;
    try {
      const decimals = fromToken.decimals || 18;
      console.log(`Parsing amount ${amount} with ${decimals} decimals`);
      fromAmount = ethers.utils.parseUnits(amount, decimals).toString();
      console.log(`Parsed amount: ${fromAmount}`);
    } catch (error) {
      console.error('Error parsing amount to units:', error);
      // Fallback to treating the amount as raw units
      fromAmount = amount;
    }

    const requestBody: SwapRequest = {
      fromTokenAddress: fromToken.address,
      toTokenAddress: toToken.address,
      fromTokenChainId: fromChainId,
      toTokenChainId: toChainId,
      fromAmount: fromAmount,
      slippage: 0.5, // 0.5% slippage as default
      sender: walletAddress,
      recipient: walletAddress
    };

    console.log('Swap quote request:', JSON.stringify(requestBody, null, 2));

    // Use timeout for fetch to avoid hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        console.error('Symbiosis API error:', errorData);
        console.error('Response status:', response.status);
        
        // For 404 errors with these pairs, do a price-based fallback
        if (response.status === 404) {
          console.log('API returned 404, using price-based fallback');
          
          // Calculate a fallback quote based on token prices
          const fromPrice = fromToken.price || 1;
          const toPrice = toToken.price || 1;
          const inputAmount = parseFloat(amount);
          const outputAmount = (inputAmount * fromPrice) / toPrice;
          
          // Format as a big number string similar to what the API would return
          const outputDecimals = toToken.decimals || 18;
          const outputAmountInSmallestUnit = ethers.utils.parseUnits(
            outputAmount.toFixed(outputDecimals), 
            outputDecimals
          ).toString();
          
          return {
            amountOut: outputAmountInSmallestUnit,
            swapData: {
              amountOut: {
                amount: outputAmountInSmallestUnit,
                tokenAddress: toToken.address,
                tokenSymbol: toToken.symbol,
                tokenDecimals: outputDecimals
              },
              // Minimal mock data for fallback
              priceImpact: "0",
              swapId: "fallback",
              tx: { to: "", data: "", value: "0", gasLimit: "0" }
            }
          };
        }
        
        throw new Error(errorData.message || `Failed to get swap quote: ${response.statusText}`);
      }

      const quoteData = await response.json();
      console.log('Swap quote received:', quoteData);

      return {
        amountOut: quoteData.amountOut.amount,
        swapData: quoteData
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timed out after 15 seconds');
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error getting swap quote:', error);
    throw error; // Let the caller handle the error for better UX
  }
};

/**
 * Execute a swap using Symbiosis API
 */
export const executeSymbiosisSwap = async (
  fromToken: Token,
  toToken: Token,
  amount: string,
  slippage: number,
  walletAddress: string,
  isTestnet: boolean = false
): Promise<boolean> => {
  try {
    if (!fromToken.address || !toToken.address || !amount || !walletAddress) {
      toast.error('Missing parameters for swap');
      return false;
    }

    // Show starting toast
    toast.info(`Preparing to swap ${amount} ${fromToken.symbol} to ${toToken.symbol}...`);

    const baseUrl = getApiBaseUrl(isTestnet);
    const swapUrl = `${baseUrl}/v1/swap/execute`;

    const fromChainId = fromToken.chainId || 1;
    const toChainId = toToken.chainId || 1;

    // Convert amount to proper units based on token decimals
    let fromAmount;
    try {
      fromAmount = ethers.utils.parseUnits(amount, fromToken.decimals || 18).toString();
    } catch (error) {
      console.error('Error parsing amount to units:', error);
      fromAmount = amount; // Use as is if parsing fails
    }

    const requestBody: SwapRequest = {
      fromTokenAddress: fromToken.address,
      toTokenAddress: toToken.address,
      fromTokenChainId: fromChainId,
      toTokenChainId: toChainId,
      fromAmount: fromAmount,
      slippage: slippage,
      sender: walletAddress,
      recipient: walletAddress
    };

    console.log('Executing swap with parameters:', requestBody);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(swapUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        console.error('Symbiosis API error:', errorData);
        console.error('Response status:', response.status);
        
        if (response.status === 404) {
          throw new Error('This swap pair is not supported by Symbiosis. Please try a different pair.');
        }
        
        throw new Error(errorData.message || `Failed to execute swap: ${response.statusText}`);
      }

      const swapData: SwapResponse = await response.json();
      console.log('Swap execution data received:', swapData);

      // Now we need to execute the transaction using the wallet
      if (!window.ethereum) {
        throw new Error('No Ethereum wallet detected');
      }

      const ethereum = window.ethereum;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      // Execute the transaction
      toast.info('Submitting transaction to your wallet...');

      const tx = await signer.sendTransaction({
        to: swapData.tx.to,
        data: swapData.tx.data,
        value: swapData.tx.value,
        gasLimit: swapData.tx.gasLimit
      });

      toast.info(`Transaction submitted. Waiting for confirmation...`, {
        action: {
          label: "View",
          onClick: () => {
            const explorerUrl = isTestnet
              ? `https://sepolia.etherscan.io/tx/${tx.hash}`
              : `https://etherscan.io/tx/${tx.hash}`;
            window.open(explorerUrl, '_blank');
          }
        }
      });

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        // Calculate received amount with decimals
        const receivedAmount = ethers.utils.formatUnits(
          swapData.amountOut.amount,
          swapData.amountOut.tokenDecimals
        );
        
        toast.success(`Successfully swapped ${amount} ${fromToken.symbol} for ${receivedAmount} ${toToken.symbol}`, {
          action: {
            label: "View",
            onClick: () => {
              const explorerUrl = isTestnet
                ? `https://sepolia.etherscan.io/tx/${receipt.transactionHash}`
                : `https://etherscan.io/tx/${receipt.transactionHash}`;
              window.open(explorerUrl, '_blank');
            }
          }
        });
        return true;
      } else {
        toast.error('Swap transaction failed. Please check explorer for details.');
        return false;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        toast.error('Request timed out after 15 seconds. Please try again.');
        return false;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error executing Symbiosis swap:', error);
    toast.error(`Swap failed: ${(error as Error).message}`);
    return false;
  }
};

/**
 * Get supported networks from Symbiosis API
 */
export const getSymbiosisSupportedNetworks = async (isTestnet: boolean = false): Promise<any[]> => {
  try {
    const baseUrl = getApiBaseUrl(isTestnet);
    const url = `${baseUrl}/v1/networks`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to fetch supported networks');
      }

      const networks = await response.json();
      return networks;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Network request timed out');
        return [];
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching supported networks:', error);
    return [];
  }
};

/**
 * Check if Symbiosis supports a specific token pair
 * Updated with more reliable fallback logic
 */
export const isTokenPairSupported = async (
  fromToken: Token,
  toToken: Token,
  isTestnet: boolean = false
): Promise<boolean> => {
  try {
    console.log("Checking token pair support:", {
      fromToken: `${fromToken?.symbol} (${fromToken?.chainId})`,
      toToken: `${toToken?.symbol} (${toToken?.chainId})`
    });
    
    // Basic validation
    if (!fromToken || !toToken || !fromToken.address || !toToken.address) {
      console.log("Token validation failed - missing tokens or addresses");
      return false;
    }
    
    // ALWAYS SUPPORT TESTNET PAIRS FOR DEMO PURPOSES
    if (isTestnet) {
      console.log("Running on testnet - supporting all pairs for demo purposes");
      return true;
    }
    
    // CROSS-CHAIN SWAPS: If the chainIds are different, consider it supported
    // This is Symbiosis's specialty
    if (fromToken.chainId && toToken.chainId && fromToken.chainId !== toToken.chainId) {
      console.log(`Cross-chain swap detected: ${fromToken.chainId} -> ${toToken.chainId}`);
      return true;
    }
    
    // SAME-CHAIN COMMON PAIRS: Check against a list of known supported pairs
    if (fromToken.symbol && toToken.symbol) {
      // Common supported tokens by symbol
      const supportedTokens = ['ETH', 'WETH', 'USDT', 'USDC', 'DAI', 'WBTC', 'SIS', 'BNB', 'MATIC'];
      
      if (supportedTokens.includes(fromToken.symbol) && supportedTokens.includes(toToken.symbol)) {
        console.log(`Both ${fromToken.symbol} and ${toToken.symbol} are in the supported tokens list`);
        return true;
      }
      
      // Common pairs frequently supported
      const commonPairs = [
        ['ETH', 'USDT'], ['USDT', 'ETH'],
        ['ETH', 'DAI'], ['DAI', 'ETH'],
        ['ETH', 'USDC'], ['USDC', 'ETH'],
        ['BNB', 'ETH'], ['ETH', 'BNB'],
        ['WETH', 'USDT'], ['USDT', 'WETH'],
        ['WETH', 'USDC'], ['USDC', 'WETH'],
        ['WBTC', 'ETH'], ['ETH', 'WBTC'],
        ['MATIC', 'ETH'], ['ETH', 'MATIC'],
        ['SIS', 'ETH'], ['ETH', 'SIS'],
        ['USDC', 'USDT'], ['USDT', 'USDC']
      ];
      
      for (const [from, to] of commonPairs) {
        if (fromToken.symbol.includes(from) && toToken.symbol.includes(to)) {
          console.log(`Pair ${fromToken.symbol}-${toToken.symbol} matches common pair ${from}-${to}`);
          return true;
        }
      }
    }
    
    // Try the API call as a last resort
    try {
      const baseUrl = getApiBaseUrl(isTestnet);
      // The API endpoint for checking supported tokens
      const url = `${baseUrl}/v1/tokens/routes?fromChainId=${fromToken.chainId}&toChainId=${toToken.chainId}`;
      
      console.log(`Checking token pair support with URL: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`API returned ${response.status}: ${response.statusText}`);
        
        // If we get a 404, that means the API endpoint is not supported, not necessarily the token pair
        if (response.status === 404) {
          console.log("API returns 404 - check based on our static rules instead");
          // For same-chain swaps with common tokens, assume supported
          if (fromToken.chainId === toToken.chainId) {
            const commonTokens = ['ETH', 'WETH', 'USDT', 'USDC', 'DAI', 'WBTC'];
            if (commonTokens.includes(fromToken.symbol) && commonTokens.includes(toToken.symbol)) {
              return true;
            }
          }
          return false;
        }
        
        throw new Error(`API error: ${response.statusText}`);
      }
      
      const routesData = await response.json();
      console.log('Routes data:', routesData);
      
      return Array.isArray(routesData) && routesData.length > 0;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log("API request timed out - using hardcoded fallback logic");
      } else {
        console.error('Error checking token pair support via API:', error);
      }
      
      // We've already checked using hardcoded logic above
      // For common tokens on popular chains, be optimistic
      if (['ETH', 'WETH', 'USDT', 'USDC'].includes(fromToken.symbol) && 
          ['ETH', 'WETH', 'USDT', 'USDC'].includes(toToken.symbol)) {
        return true;
      }
    }
    
    // If we get here, the pair is not in our hardcoded lists and the API check failed or was inconclusive
    console.log(`${fromToken.symbol}-${toToken.symbol} pair is not supported based on static checks`);
    return false;
  } catch (error) {
    console.error('Error checking token pair support:', error);
    return false;
  }
};

// Import ethers for blockchain interactions
import { ethers } from 'ethers';

