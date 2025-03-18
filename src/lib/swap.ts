
import { toast } from 'sonner';
import { Token } from '@/types'; // Updated import path
import { getSigner } from './ethereum';
import { ethers } from 'ethers';
import { 
  executeSymbiosisSwap, 
  getSymbiosisSwapQuote, 
  isSymbiosisTokenPairSupported,
  getTokenBalance
} from './symbiosisSwap';

/**
 * Swap tokens using a decentralized exchange
 * Will try Symbiosis first, then fall back to a simple swap
 */
export const swapTokens = async (
  fromToken: Token,
  toToken: Token,
  amount: string,
  slippage: number,
  address: string,
  isTestnet: boolean = false
): Promise<boolean> => {
  try {
    console.log("Starting swap process for tokens:", {
      from: `${fromToken.symbol} (${fromToken.chainId})`,
      to: `${toToken.symbol} (${toToken.chainId})`,
      amount,
      slippage,
      isTestnet
    });

    // Check if amount is valid
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount to swap");
      return false;
    }

    // Check token balance
    try {
      const balance = await getTokenBalance(fromToken, address);
      if (parseFloat(balance) < parseFloat(amount)) {
        toast.error(`Insufficient ${fromToken.symbol} balance`);
        return false;
      }
    } catch (error) {
      console.error("Error checking balance:", error);
      // Continue with the swap attempt even if balance check fails
    }

    // First check if we can use Symbiosis
    const isSymbiosisSupported = await isSymbiosisTokenPairSupported(fromToken, toToken, isTestnet);
    console.log(`Symbiosis support for ${fromToken.symbol}-${toToken.symbol}: ${isSymbiosisSupported}`);

    if (isSymbiosisSupported) {
      try {
        // If Symbiosis supports this pair, use it
        console.log("Using Symbiosis for swap");
        return await executeSymbiosisSwap(fromToken, toToken, amount, slippage, address, isTestnet);
      } catch (error) {
        console.error("Symbiosis swap failed, falling back to simulation:", error);
        // If Symbiosis fails, continue to fallback
      }
    }
    
    // Fallback to a simple swap simulation
    console.log("Using fallback swap simulation");
    toast.info(`Swapping ${amount} ${fromToken.symbol} for ${toToken.symbol} (Simulated)`);
    
    // Simulate a swap delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const estimatedOutput = calculateSimpleSwapAmount(fromToken, toToken, amount);
    toast.success(`Successfully swapped for ${estimatedOutput} ${toToken.symbol} (Simulated)`);
    return true;
  } catch (error) {
    console.error('Error swapping tokens:', error);
    toast.error(`Swap failed: ${(error as Error).message || 'Unknown error'}`);
    return false;
  }
};

/**
 * Calculate a simple swap amount based on token prices
 * Used as a fallback when Symbiosis is not available
 */
const calculateSimpleSwapAmount = (fromToken: Token, toToken: Token, amount: string): string => {
  if (!fromToken || !toToken || !amount) {
    return '0';
  }
  
  const fromPrice = fromToken.price || 1;
  const toPrice = toToken.price || 1;
  const inputAmount = parseFloat(amount);
  const inputValue = inputAmount * fromPrice;
  const outputAmount = inputValue / toPrice;
  
  return outputAmount.toFixed(6);
};

/**
 * Calculate output amount based on input amount and token prices
 * Use Symbiosis for quote first, fall back to simple calculation
 */
export const calculateOutputAmount = async (
  fromToken: Token,
  toToken: Token,
  amount: string,
  address: string | undefined,
  isTestnet: boolean = false
): Promise<string> => {
  if (!amount || parseFloat(amount) <= 0 || !fromToken || !toToken) {
    return '0';
  }
  
  console.log("Calculating output amount:", {
    from: fromToken.symbol,
    to: toToken.symbol,
    amount,
    address: address ? `${address.substring(0, 6)}...` : 'undefined'
  });
  
  // Check if Symbiosis supports this pair
  let isSupportedBySymbiosis = false;
  try {
    isSupportedBySymbiosis = await isSymbiosisTokenPairSupported(fromToken, toToken, isTestnet);
    console.log(`Symbiosis support for ${fromToken.symbol}-${toToken.symbol}: ${isSupportedBySymbiosis}`);
  } catch (error) {
    console.error("Error checking Symbiosis support:", error);
    // If there's an error checking support, assume it's not supported
  }
  
  // Try to get quote from Symbiosis if address is available and pair is supported
  if (address && isSupportedBySymbiosis) {
    try {
      console.log("Getting Symbiosis quote");
      const quote = await getSymbiosisSwapQuote(fromToken, toToken, amount, address, isTestnet);
      if (quote) {
        console.log("Received Symbiosis quote:", quote);
        // Use try-catch for formatting since decimals might be undefined or invalid
        try {
          return ethers.utils.formatUnits(quote.amountOut, toToken.decimals || 18);
        } catch (error) {
          console.error("Error formatting quote output:", error);
          // If formatting fails, fall back to simple calculation
        }
      }
    } catch (error) {
      console.error('Error getting Symbiosis quote:', error);
      // Log specific error message for debugging
      console.error('Specific error message:', (error as Error).message);
      // Fall back to simple calculation
    }
  } else {
    console.log(`Not using Symbiosis quote: address=${!!address}, supported=${isSupportedBySymbiosis}`);
  }
  
  // Simple calculation based on token prices
  console.log("Using price-based calculation");
  return calculateSimpleSwapAmount(fromToken, toToken, amount);
};

/**
 * Approve token spending on a contract
 */
export const approveToken = async (
  token: Token,
  spenderAddress: string,
  amount: string
): Promise<boolean> => {
  try {
    if (!token || !token.address) {
      throw new Error('Token address not available');
    }
    
    // For native tokens like ETH, no approval needed
    if (token.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
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
    toast.error(`Approval failed: ${(error as Error).message || 'Unknown error'}`);
    return false;
  }
};

