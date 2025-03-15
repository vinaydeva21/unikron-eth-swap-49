import { Token } from '@/lib/types';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { getSigner, getProvider } from '@/lib/ethereum';

/**
 * Get the correct API base URL based on environment
 */
const getApiBaseUrl = (isTestnet: boolean): string => {
  return isTestnet
    ? 'https://api.testnet.symbiosis.finance/crosschain'
    : 'https://api-v2.symbiosis.finance/crosschain';
};

/**
 * Interface for swap request
 */
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

/**
 * Interface for swap response
 */
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
 * Get swap quote from Symbiosis API
 */
export const getSymbiosisSwapQuote = async (
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
      walletAddress,
      isTestnet
    });

    const baseUrl = getApiBaseUrl(isTestnet);
    const url = `${baseUrl}/v1/swap/quote`;

    const fromChainId = fromToken.chainId || 1; // Default to Ethereum Mainnet
    const toChainId = toToken.chainId || 1;

    // Convert amount to proper units based on token decimals
    let amountInWei;
    try {
      amountInWei = ethers.utils.parseUnits(amount, fromToken.decimals || 18).toString();
    } catch (error) {
      console.error('Error parsing amount:', error);
      // Fallback to a simple conversion if parseUnits fails
      amountInWei = (parseFloat(amount) * Math.pow(10, fromToken.decimals || 18)).toString();
    }

    const requestBody: SwapRequest = {
      fromTokenAddress: fromToken.address,
      toTokenAddress: toToken.address,
      fromTokenChainId: fromChainId,
      toTokenChainId: toChainId,
      fromAmount: amountInWei,
      slippage: 0.5, // 0.5% slippage as default
      sender: walletAddress,
      recipient: walletAddress
    };

    console.log('Swap quote request body:', requestBody);

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
    return null;
  }
};

/**
 * Perform a token swap using Symbiosis
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
    let amountInWei;
    try {
      amountInWei = ethers.utils.parseUnits(amount, fromToken.decimals || 18).toString();
    } catch (error) {
      console.error('Error parsing amount:', error);
      // Fallback to a simple conversion if parseUnits fails
      amountInWei = (parseFloat(amount) * Math.pow(10, fromToken.decimals || 18)).toString();
    }

    const requestBody: SwapRequest = {
      fromTokenAddress: fromToken.address,
      toTokenAddress: toToken.address,
      fromTokenChainId: fromChainId,
      toTokenChainId: toChainId,
      fromAmount: amountInWei,
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

    const signer = getSigner();

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
 * Check if Symbiosis supports a specific token pair
 * Updated to handle API failures and provide better fallbacks
 */
export const isSymbiosisTokenPairSupported = async (
  fromToken: Token,
  toToken: Token,
  isTestnet: boolean = false
): Promise<boolean> => {
  try {
    console.log("Checking Symbiosis token pair support:", {
      fromToken: `${fromToken?.symbol} (${fromToken?.chainId})`,
      toToken: `${toToken?.symbol} (${toToken?.chainId})`
    });

    // Basic validation to avoid unnecessary API calls
    if (!fromToken || !toToken || !fromToken.address || !toToken.address) {
      console.log("Token validation failed - missing tokens or addresses");
      return false;
    }

    // CROSS-CHAIN SWAPS: If tokens are on different chains, it's a cross-chain swap (Symbiosis specialty)
    if (fromToken.chainId && toToken.chainId && fromToken.chainId !== toToken.chainId) {
      console.log(`Cross-chain swap detected: ${fromToken.chainId} -> ${toToken.chainId}`);
      return true;
    }

    // SAME-CHAIN COMMON PAIRS: Check against list of commonly supported pairs
    if (fromToken.symbol && toToken.symbol) {
      // List of commonly supported tokens
      const supportedTokens = ['ETH', 'WETH', 'USDT', 'USDC', 'DAI', 'WBTC', 'SIS', 'BNB', 'MATIC'];
      
      if (supportedTokens.includes(fromToken.symbol) && supportedTokens.includes(toToken.symbol)) {
        console.log(`Both ${fromToken.symbol} and ${toToken.symbol} are in the supported tokens list`);
        return true;
      }
      
      // Common pairs that are typically supported
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
    
    // TESTNET SPECIAL CASE: On testnet, consider more pairs as supported for demo purposes
    if (isTestnet) {
      console.log("Running on testnet - considering most pairs as supported for demo");
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
      return Array.isArray(routesData) && routesData.length > 0;
    } catch (error) {
      console.error('Error checking token pair support via API:', error);
      // API check failed, but we've already checked using hardcoded logic
    }
    
    // If we get here, the pair is not in our hardcoded lists and the API check failed
    console.log(`${fromToken.symbol}-${toToken.symbol} pair is not supported`);
    return false;
  } catch (error) {
    console.error('Error checking Symbiosis token pair support:', error);
    return false;
  }
};

/**
 * Fetch token balances for a wallet address
 */
export const getTokenBalance = async (
  token: Token,
  walletAddress: string
): Promise<string> => {
  try {
    if (!token.address || !walletAddress) {
      return '0';
    }

    const provider = getProvider();

    // For native ETH
    if (token.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      const balance = await provider.getBalance(walletAddress);
      return ethers.utils.formatUnits(balance, token.decimals || 18);
    }

    // For ERC20 tokens
    const tokenContract = new ethers.Contract(
      token.address,
      ['function balanceOf(address owner) view returns (uint256)'],
      provider
    );

    const balance = await tokenContract.balanceOf(walletAddress);
    return ethers.utils.formatUnits(balance, token.decimals || 18);
  } catch (error) {
    console.error('Error getting token balance:', error);
    return '0';
  }
};

/**
 * Approve token spending on a contract
 */
export const approveTokenForSymbiosis = async (
  token: Token,
  spenderAddress: string,
  amount: string,
  isTestnet: boolean = false
): Promise<boolean> => {
  try {
    if (!token.address || token.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      // Native token doesn't need approval
      return true;
    }
    
    const signer = getSigner();
    const tokenContract = new ethers.Contract(
      token.address,
      [
        'function approve(address spender, uint amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint)'
      ],
      signer
    );
    
    const amountInWei = ethers.utils.parseUnits(amount, token.decimals || 18);
    
    toast.info(`Approving ${token.symbol} for trading...`);
    const tx = await tokenContract.approve(spenderAddress, amountInWei);
    await tx.wait();
    
    toast.success(`Approved ${token.symbol} for trading`);
    return true;
  } catch (error) {
    console.error('Error approving token:', error);
    toast.error(`Approval failed: ${(error as Error).message}`);
    return false;
  }
};
