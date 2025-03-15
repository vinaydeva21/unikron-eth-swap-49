
import { Token } from '@/lib/types';
import { toast } from 'sonner';

// Symbiosis API base URLs
const SYMBIOSIS_API_BASE = 'https://api.symbiosis.finance/crosschain';
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

    const requestBody: SwapRequest = {
      fromTokenAddress: fromToken.address,
      toTokenAddress: toToken.address,
      fromTokenChainId: fromChainId,
      toTokenChainId: toChainId,
      fromAmount: amount,
      slippage: 0.5, // 0.5% slippage as default
      sender: walletAddress,
      recipient: walletAddress
    };

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

    const requestBody: SwapRequest = {
      fromTokenAddress: fromToken.address,
      toTokenAddress: toToken.address,
      fromTokenChainId: fromChainId,
      toTokenChainId: toChainId,
      fromAmount: amount,
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
 */
export const isTokenPairSupported = async (
  fromToken: Token,
  toToken: Token,
  isTestnet: boolean = false
): Promise<boolean> => {
  try {
    if (!fromToken.address || !toToken.address) {
      return false;
    }

    const baseUrl = getApiBaseUrl(isTestnet);
    const url = `${baseUrl}/v1/tokens/supported?fromChainId=${fromToken.chainId}&toChainId=${toToken.chainId}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to check token pair support');
    }

    const supportedTokens = await response.json();
    
    // Check if fromToken and toToken are in the supported list
    const isFromSupported = supportedTokens.some(
      (token: any) => token.address.toLowerCase() === fromToken.address?.toLowerCase()
    );
    
    const isToSupported = supportedTokens.some(
      (token: any) => token.address.toLowerCase() === toToken.address?.toLowerCase()
    );

    return isFromSupported && isToSupported;
  } catch (error) {
    console.error('Error checking token pair support:', error);
    return false;
  }
};

// Import ethers for blockchain interactions
import { ethers } from 'ethers';
