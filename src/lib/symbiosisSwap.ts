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
 * Special chain IDs for non-EVM chains
 */
const SPECIAL_CHAIN_IDS = {
  BITCOIN: 9000, // Note: This is just for identification, not an actual EVM chainId
  BITCOIN_TESTNET: 9001,
  TON: 9010,
  TON_TESTNET: 9011
};

/**
 * Get the correct chain ID for special chains like Bitcoin and TON
 */
const getSpecialChainId = (network: string, isTestnet: boolean): number | null => {
  const normalizedNetwork = network.toLowerCase();
  
  if (normalizedNetwork.includes('bitcoin') || normalizedNetwork.includes('btc')) {
    return isTestnet ? SPECIAL_CHAIN_IDS.BITCOIN_TESTNET : SPECIAL_CHAIN_IDS.BITCOIN;
  }
  
  if (normalizedNetwork.includes('ton')) {
    return isTestnet ? SPECIAL_CHAIN_IDS.TON_TESTNET : SPECIAL_CHAIN_IDS.TON;
  }
  
  return null;
};

/**
 * Supported EVM chain IDs by Symbiosis (mainnet and testnet)
 * Source: https://docs.symbiosis.finance/reference/supported-networks
 */
const SYMBIOSIS_SUPPORTED_CHAIN_IDS = {
  mainnet: [
    1, // Ethereum
    56, // BSC
    137, // Polygon
    42161, // Arbitrum
    10, // Optimism
    43114, // Avalanche
    250, // Fantom
    8453, // Base
    324, // zkSync Era
    59144, // Linea
    1101, // Polygon zkEVM
    534352, // Scroll
    81457, // Blast
  ],
  testnet: [
    11155111, // Sepolia (Ethereum)
    97, // BSC testnet
    59140, // Linea Goerli
    421614, // Arbitrum Sepolia
    80001, // Mumbai (Polygon)
    11155420, // Optimism Sepolia
    84532, // Base Sepolia
  ]
};

/**
 * Check if Symbiosis supports a specific token pair
 * Update with knowledge from the documentation
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
    if (!fromToken || !toToken) {
      console.log("Token validation failed - missing tokens");
      return false;
    }

    // For special chains like BTC and TON, we need special handling
    const fromNetworkName = fromToken.network || '';
    const toNetworkName = toToken.network || '';
    
    // Check if either token is on a special chain (BTC or TON)
    const fromSpecialChainId = getSpecialChainId(fromNetworkName, isTestnet);
    const toSpecialChainId = getSpecialChainId(toNetworkName, isTestnet);
    
    // If we have special chains, check support based on documentation
    if (fromSpecialChainId || toSpecialChainId) {
      console.log(`Special chain detected: ${fromSpecialChainId || fromToken.chainId} -> ${toSpecialChainId || toToken.chainId}`);
      
      // According to docs, BTC and TON are supported for cross-chain swaps
      return true;
    }

    // Determine chain IDs with fallbacks
    const fromChainId = fromToken.chainId || 1; // Default to Ethereum Mainnet
    const toChainId = toToken.chainId || 1;
    
    // Check if both chain IDs are supported by Symbiosis
    const supportedChainIds = isTestnet 
      ? SYMBIOSIS_SUPPORTED_CHAIN_IDS.testnet
      : SYMBIOSIS_SUPPORTED_CHAIN_IDS.mainnet;
    
    const isFromChainSupported = supportedChainIds.includes(fromChainId);
    const isToChainSupported = supportedChainIds.includes(toChainId);
    
    if (!isFromChainSupported || !isToChainSupported) {
      console.log(`Chain ID not supported: fromChainId=${fromChainId} (${isFromChainSupported}), toChainId=${toChainId} (${isToChainSupported})`);
      
      // Special case: on testnet, we'll be more permissive
      if (isTestnet) {
        console.log("Running on testnet - considering as supported for testing");
        return true;
      }
      
      return false;
    }

    // CROSS-CHAIN SWAPS: If tokens are on different chains, it's a cross-chain swap (Symbiosis specialty)
    if (fromChainId !== toChainId) {
      console.log(`Cross-chain swap detected: ${fromChainId} -> ${toChainId}`);
      return true;
    }

    // For same-chain swaps, we need to check token addresses
    if (!fromToken.address || !toToken.address) {
      console.log("Token validation failed - missing addresses for same-chain swap");
      return false;
    }

    // SAME-CHAIN COMMON PAIRS: Check against list of commonly supported tokens
    if (fromToken.symbol && toToken.symbol) {
      // List of commonly supported tokens
      const supportedTokens = ['ETH', 'WETH', 'USDT', 'USDC', 'DAI', 'WBTC', 'BNB', 'MATIC', 'BTC', 'TON'];
      
      if (supportedTokens.includes(fromToken.symbol) && supportedTokens.includes(toToken.symbol)) {
        console.log(`Both ${fromToken.symbol} and ${toToken.symbol} are in the supported tokens list`);
        return true;
      }
    }
    
    // TESTNET SPECIAL CASE: On testnet, consider most pairs as supported for demo purposes
    if (isTestnet) {
      console.log("Running on testnet - considering most pairs as supported for demo");
      return true;
    }

    // Try the API call to check if the pair is supported
    try {
      const baseUrl = getApiBaseUrl(isTestnet);
      const url = `${baseUrl}/v1/tokens/routes?fromChainId=${fromChainId}&toChainId=${toChainId}`;
      
      console.log(`Checking token pair support with URL: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`API returned ${response.status}: ${response.statusText}`);
        return false;
      }
      
      const routesData = await response.json();
      console.log('Routes data:', routesData);
      
      // Process the response according to the actual API structure
      return Array.isArray(routesData) && routesData.length > 0;
    } catch (error) {
      console.error('Error checking token pair support via API:', error);
      // API check failed, fallback to false
      return false;
    }
  } catch (error) {
    console.error('Error checking Symbiosis token pair support:', error);
    return false;
  }
};

/**
 * Get swap quote from Symbiosis API with updated error handling
 */
export const getSymbiosisSwapQuote = async (
  fromToken: Token,
  toToken: Token,
  amount: string,
  walletAddress: string,
  isTestnet: boolean = false
): Promise<{ amountOut: string; swapData: any } | null> => {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      console.log("Invalid amount for swap quote:", amount);
      return null;
    }

    if (!fromToken || !toToken) {
      console.error('Missing tokens for swap quote');
      return null;
    }

    console.log('Getting swap quote with parameters:', {
      fromToken: `${fromToken?.symbol} (${fromToken?.chainId})`,
      toToken: `${toToken?.symbol} (${toToken?.chainId})`,
      amount,
      walletAddress: walletAddress ? `${walletAddress.substring(0, 6)}...` : 'undefined',
      isTestnet
    });

    // Handle special chains like BTC and TON
    const fromSpecialChainId = getSpecialChainId(fromToken.network || '', isTestnet);
    const toSpecialChainId = getSpecialChainId(toToken.network || '', isTestnet);
    
    // Use chain IDs from tokens with fallbacks
    const fromChainId = fromSpecialChainId || fromToken.chainId || 1;
    const toChainId = toSpecialChainId || toToken.chainId || 1;

    // For demonstration/simulation, if the token doesn't have an address, create a placeholder
    const fromTokenAddress = fromToken.address || '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    const toTokenAddress = toToken.address || '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

    // Convert amount to proper units based on token decimals
    let amountInWei;
    try {
      amountInWei = ethers.utils.parseUnits(amount, fromToken.decimals || 18).toString();
    } catch (error) {
      console.error('Error parsing amount to units:', error);
      // Fallback to a simple conversion if parseUnits fails
      amountInWei = (parseFloat(amount) * Math.pow(10, fromToken.decimals || 18)).toString();
    }

    const baseUrl = getApiBaseUrl(isTestnet);
    const url = `${baseUrl}/v1/swap/quote`;

    const requestBody: SwapRequest = {
      fromTokenAddress: fromTokenAddress,
      toTokenAddress: toTokenAddress,
      fromTokenChainId: fromChainId,
      toTokenChainId: toChainId,
      fromAmount: amountInWei,
      slippage: 0.5, // 0.5% slippage as default
      sender: walletAddress,
      recipient: walletAddress
    };

    console.log('Swap quote request body:', requestBody);

    // For testing/development purposes, simulate a response if needed
    if (isTestnet && (fromSpecialChainId || toSpecialChainId)) {
      console.log("Using simulated response for special chains in testnet");

      // Simulate the output amount based on token prices
      const inputAmount = parseFloat(amount);
      const fromPrice = fromToken.price || 1;
      const toPrice = toToken.price || 1;
      const outputValue = (inputAmount * fromPrice) / toPrice;
      
      // Convert to Wei for consistency with API response
      const simulatedAmountOut = ethers.utils.parseUnits(
        outputValue.toFixed(toToken.decimals || 18),
        toToken.decimals || 18
      ).toString();
      
      return {
        amountOut: simulatedAmountOut,
        swapData: {
          amountOut: {
            amount: simulatedAmountOut,
            tokenAddress: toTokenAddress,
            tokenSymbol: toToken.symbol,
            tokenDecimals: toToken.decimals || 18
          },
          // Other simulated data would go here
        }
      };
    }

    // Make the actual API call
    try {
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
      console.error('Error getting swap quote from API:', error);
      
      // Fallback to simple price-based calculation for demo purposes
      const inputAmount = parseFloat(amount);
      const fromPrice = fromToken.price || 1;
      const toPrice = toToken.price || 1;
      const outputValue = (inputAmount * fromPrice) / toPrice;
      
      // Convert to Wei for consistency with API response
      const fallbackAmountOut = ethers.utils.parseUnits(
        outputValue.toFixed(toToken.decimals || 18),
        toToken.decimals || 18
      ).toString();
      
      console.log(`Using fallback calculation: ${inputAmount} × ${fromPrice} / ${toPrice} = ${outputValue}`);
      
      return {
        amountOut: fallbackAmountOut,
        swapData: {
          amountOut: {
            amount: fallbackAmountOut,
            tokenAddress: toTokenAddress,
            tokenSymbol: toToken.symbol,
            tokenDecimals: toToken.decimals || 18
          }
        }
      };
    }
  } catch (error) {
    console.error('Error getting swap quote:', error);
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
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Invalid amount for swap");
      return false;
    }

    if (!fromToken || !toToken) {
      toast.error('Missing tokens for swap');
      return false;
    }

    // Show starting toast
    toast.info(`Preparing to swap ${amount} ${fromToken.symbol} to ${toToken.symbol}...`);

    // Handle special chains like BTC and TON
    const fromSpecialChainId = getSpecialChainId(fromToken.network || '', isTestnet);
    const toSpecialChainId = getSpecialChainId(toToken.network || '', isTestnet);
    
    // Special handling for BTC/TON swaps
    if (fromSpecialChainId === SPECIAL_CHAIN_IDS.BITCOIN || 
        fromSpecialChainId === SPECIAL_CHAIN_IDS.BITCOIN_TESTNET ||
        toSpecialChainId === SPECIAL_CHAIN_IDS.BITCOIN || 
        toSpecialChainId === SPECIAL_CHAIN_IDS.BITCOIN_TESTNET) {
      toast.info("Bitcoin swaps require a Bitcoin wallet. Please check documentation.");
      // This would require Bitcoin-specific code which is beyond the scope of this example
      return false;
    }
    
    if (fromSpecialChainId === SPECIAL_CHAIN_IDS.TON || 
        fromSpecialChainId === SPECIAL_CHAIN_IDS.TON_TESTNET ||
        toSpecialChainId === SPECIAL_CHAIN_IDS.TON || 
        toSpecialChainId === SPECIAL_CHAIN_IDS.TON_TESTNET) {
      toast.info("TON swaps require a TON wallet. Please check documentation.");
      // This would require TON-specific code which is beyond the scope of this example
      return false;
    }

    // Use chain IDs from tokens with fallbacks
    const fromChainId = fromToken.chainId || 1;
    const toChainId = toToken.chainId || 1;

    // For demonstration/simulation, if the token doesn't have an address, create a placeholder
    const fromTokenAddress = fromToken.address || '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    const toTokenAddress = toToken.address || '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

    // Convert amount to proper units based on token decimals
    let amountInWei;
    try {
      amountInWei = ethers.utils.parseUnits(amount, fromToken.decimals || 18).toString();
    } catch (error) {
      console.error('Error parsing amount:', error);
      // Fallback to a simple conversion if parseUnits fails
      amountInWei = (parseFloat(amount) * Math.pow(10, fromToken.decimals || 18)).toString();
    }

    const baseUrl = getApiBaseUrl(isTestnet);
    const swapUrl = `${baseUrl}/v1/swap/execute`;

    const requestBody: SwapRequest = {
      fromTokenAddress: fromTokenAddress,
      toTokenAddress: toTokenAddress,
      fromTokenChainId: fromChainId,
      toTokenChainId: toChainId,
      fromAmount: amountInWei,
      slippage: slippage,
      sender: walletAddress,
      recipient: walletAddress
    };

    console.log('Executing swap with parameters:', requestBody);

    // Make the API call
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
          const chainId = fromToken.chainId || 1;
          let explorerUrl;
          
          // Select the appropriate explorer based on chainId
          switch (chainId) {
            case 56: // BSC
              explorerUrl = isTestnet 
                ? `https://testnet.bscscan.com/tx/${tx.hash}`
                : `https://bscscan.com/tx/${tx.hash}`;
              break;
            case 137: // Polygon
              explorerUrl = isTestnet 
                ? `https://mumbai.polygonscan.com/tx/${tx.hash}`
                : `https://polygonscan.com/tx/${tx.hash}`;
              break;
            case 42161: // Arbitrum
              explorerUrl = isTestnet 
                ? `https://sepolia.arbiscan.io/tx/${tx.hash}`
                : `https://arbiscan.io/tx/${tx.hash}`;
              break;
            case 10: // Optimism
              explorerUrl = isTestnet 
                ? `https://sepolia-optimism.etherscan.io/tx/${tx.hash}`
                : `https://optimistic.etherscan.io/tx/${tx.hash}`;
              break;
            default: // Default to Ethereum
              explorerUrl = isTestnet
                ? `https://sepolia.etherscan.io/tx/${tx.hash}`
                : `https://etherscan.io/tx/${tx.hash}`;
          }
          
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
            const chainId = toToken.chainId || 1;
            let explorerUrl;
            
            // Select the appropriate explorer based on chainId
            switch (chainId) {
              case 56: // BSC
                explorerUrl = isTestnet 
                  ? `https://testnet.bscscan.com/tx/${receipt.transactionHash}`
                  : `https://bscscan.com/tx/${receipt.transactionHash}`;
                break;
              case 137: // Polygon
                explorerUrl = isTestnet 
                  ? `https://mumbai.polygonscan.com/tx/${receipt.transactionHash}`
                  : `https://polygonscan.com/tx/${receipt.transactionHash}`;
                break;
              case 42161: // Arbitrum
                explorerUrl = isTestnet 
                  ? `https://sepolia.arbiscan.io/tx/${receipt.transactionHash}`
                  : `https://arbiscan.io/tx/${receipt.transactionHash}`;
                break;
              case 10: // Optimism
                explorerUrl = isTestnet 
                  ? `https://sepolia-optimism.etherscan.io/tx/${receipt.transactionHash}`
                  : `https://optimistic.etherscan.io/tx/${receipt.transactionHash}`;
                break;
              default: // Default to Ethereum
                explorerUrl = isTestnet
                  ? `https://sepolia.etherscan.io/tx/${receipt.transactionHash}`
                  : `https://etherscan.io/tx/${receipt.transactionHash}`;
            }
            
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
 * Fetch token balances for a wallet address
 */
export const getTokenBalance = async (
  token: Token,
  walletAddress: string
): Promise<string> => {
  try {
    if (!token || !walletAddress) {
      return '0';
    }

    // Special handling for BTC or TON
    if (token.network?.toLowerCase().includes('bitcoin') || token.network?.toLowerCase().includes('btc')) {
      console.log('Bitcoin balance checking requires a specialized wallet');
      return '0';
    }
    
    if (token.network?.toLowerCase().includes('ton')) {
      console.log('TON balance checking requires a specialized wallet');
      return '0';
    }

    const provider = getProvider();

    // For native ETH and other native tokens
    if (!token.address || token.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
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
    if (!token || !token.address || token.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
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
