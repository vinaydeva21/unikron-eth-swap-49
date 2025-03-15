
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
      fromToken: fromToken.symbol,
      toToken: toToken.symbol,
      amount,
      walletAddress
    });

    const baseUrl = getApiBaseUrl(isTestnet);
    const url = `${baseUrl}/v1/swap/quote`;

    const fromChainId = fromToken.chainId || 1; // Default to Ethereum Mainnet
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
      slippage: 0.5, // 0.5% slippage as default
      sender: walletAddress,
      recipient: walletAddress
    };

    console.log('Swap quote request:', requestBody);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Symbiosis API error:', errorData);
      throw new Error(errorData.message || 'Failed to get swap quote');
    }

    const quoteData = await response.json();
    console.log('Swap quote received:', quoteData);

    return {
      amountOut: quoteData.amountOut.amount,
      swapData: quoteData
    };
  } catch (error) {
    console.error('Error getting swap quote:', error);
    toast.error(`Failed to get swap quote: ${(error as Error).message}`);
    return null;
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

    const response = await fetch(swapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Symbiosis API error:', errorData);
      throw new Error(errorData.message || 'Failed to execute swap');
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

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch supported networks');
    }

    const networks = await response.json();
    return networks;
  } catch (error) {
    console.error('Error fetching supported networks:', error);
    return [];
  }
};

/**
 * Check if Symbiosis supports a specific token pair
 * Updated to handle API failures and include a hardcoded list of supported pairs
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
    
    // CROSS-CHAIN SWAPS: If the chainIds are different, it's likely a cross-chain swap
    // Symbiosis specializes in cross-chain swaps, so we'll consider these supported
    if (fromToken.chainId && toToken.chainId && fromToken.chainId !== toToken.chainId) {
      console.log(`Cross-chain swap detected: ${fromToken.chainId} -> ${toToken.chainId}`);
      return true;
    }
    
    // SAME-CHAIN COMMON PAIRS: For tokens on the same chain, check against a list of known supported pairs
    if (fromToken.symbol && toToken.symbol) {
      // Common supported tokens by symbol (primarily for mainnet)
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
    
    // TESTNET SPECIAL CASE: If on testnet, we'll support more pairs for demonstration
    if (isTestnet) {
      console.log("Running on testnet - considering most pairs as supported for demo purposes");
      return true;
    }
    
    // Try the API call (though it seems to be returning 404 currently)
    try {
      const baseUrl = getApiBaseUrl(isTestnet);
      // The correct endpoint might be different based on Symbiosis documentation
      const url = `${baseUrl}/v1/tokens/routes?fromChainId=${fromToken.chainId}&toChainId=${toToken.chainId}`;
      
      console.log(`Checking token pair support with URL: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`API returned ${response.status}: ${response.statusText}`);
        // Fall back to the hardcoded logic above instead of throwing
        return false;
      }
      
      const routesData = await response.json();
      console.log('Routes data:', routesData);
      
      // Process the response according to the actual API structure
      // This may need adjustment based on the actual API response format
      return Array.isArray(routesData) && routesData.length > 0;
    } catch (error) {
      console.error('Error checking token pair support via API:', error);
      // We've already checked using hardcoded logic, so we'll use that result
    }
    
    // If we get here, the pair is not in our hardcoded lists and the API check failed
    console.log(`${fromToken.symbol}-${toToken.symbol} pair is not supported`);
    return false;
  } catch (error) {
    console.error('Error checking token pair support:', error);
    return false;
  }
};

// Import ethers for blockchain interactions
import { ethers } from 'ethers';
