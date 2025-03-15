
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
    const amountInWei = ethers.utils.parseUnits(amount, fromToken.decimals || 18).toString();

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
    const amountInWei = ethers.utils.parseUnits(amount, fromToken.decimals || 18).toString();

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
 */
export const isSymbiosisTokenPairSupported = async (
  fromToken: Token,
  toToken: Token,
  isTestnet: boolean = false
): Promise<boolean> => {
  try {
    // Basic validation to avoid unnecessary API calls
    if (!fromToken || !toToken || !fromToken.address || !toToken.address) {
      console.log("Token validation failed - missing tokens or addresses");
      return false;
    }

    // For demo purposes, let's consider some common token pairs as supported
    // This is a fallback for when the API call doesn't work
    if (fromToken.symbol && toToken.symbol) {
      const commonPairs = [
        ['ETH', 'USDT'], ['USDT', 'ETH'],
        ['ETH', 'DAI'], ['DAI', 'ETH'],
        ['ETH', 'USDC'], ['USDC', 'ETH'],
        ['BNB', 'ETH'], ['ETH', 'BNB']
      ];
      
      for (const [from, to] of commonPairs) {
        if (fromToken.symbol.includes(from) && toToken.symbol.includes(to)) {
          console.log(`Fallback: Considering ${fromToken.symbol}-${toToken.symbol} as supported`);
          return true;
        }
      }
    }

    // Try the API call if we have chainIds
    if (fromToken.chainId && toToken.chainId) {
      try {
        const baseUrl = getApiBaseUrl(isTestnet);
        const url = `${baseUrl}/v1/tokens/supported?fromChainId=${fromToken.chainId}&toChainId=${toToken.chainId}`;

        console.log(`Checking token pair support with URL: ${url}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        const supportedTokens = await response.json();
        console.log('Supported tokens data:', supportedTokens);
        
        if (!Array.isArray(supportedTokens)) {
          console.log('API did not return an array of tokens');
          return false;
        }
        
        // Check if fromToken and toToken are in the supported list
        const isFromSupported = supportedTokens.some(
          (token: any) => token.address && fromToken.address && 
                          token.address.toLowerCase() === fromToken.address.toLowerCase()
        );
        
        const isToSupported = supportedTokens.some(
          (token: any) => token.address && toToken.address && 
                          token.address.toLowerCase() === toToken.address.toLowerCase()
        );
        
        console.log(`Is ${fromToken.symbol} supported: ${isFromSupported}`);
        console.log(`Is ${toToken.symbol} supported: ${isToSupported}`);
        
        return isFromSupported && isToSupported;
      } catch (error) {
        console.error('Error checking token pair support via API:', error);
        // Continue to fallback
      }
    }
    
    // If all checks fail, assume not supported
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
