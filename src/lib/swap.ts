
import { toast } from 'sonner';
import { Token } from '@/lib/types';
import { getSigner } from './ethereum';
import { ethers } from 'ethers';
import { executeSymbiosisSwap, getSymbiosisSwapQuote, isSymbiosisTokenPairSupported } from './symbiosisSwap';

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

    // First check if we can use Symbiosis
    const isSymbiosisSupported = await isSymbiosisTokenPairSupported(fromToken, toToken, isTestnet);
    console.log(`Symbiosis support for ${fromToken.symbol}-${toToken.symbol}: ${isSymbiosisSupported}`);

    if (isSymbiosisSupported) {
      // If Symbiosis supports this pair, use it
      console.log("Using Symbiosis for swap");
      return executeSymbiosisSwap(fromToken, toToken, amount, slippage, address, isTestnet);
    } else {
      // Fallback to a simple swap simulation
      console.log("Symbiosis not supported, using fallback swap simulation");
      toast.info(`Swapping ${amount} ${fromToken.symbol} for ${toToken.symbol} (Simulated)`);
      
      // Simulate a swap delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const estimatedOutput = calculateSimpleSwapAmount(fromToken, toToken, amount);
      toast.success(`Successfully swapped for ${estimatedOutput} ${toToken.symbol} (Simulated)`);
      return true;
    }
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
  if (!fromToken.price || !toToken.price || !amount) {
    return '0';
  }
  
  const inputAmount = parseFloat(amount);
  const inputValue = inputAmount * fromToken.price;
  const outputAmount = inputValue / toToken.price;
  
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
  if (!amount || amount === '0' || !fromToken || !toToken) {
    return '0';
  }
  
  console.log("Calculating output amount:", {
    from: fromToken.symbol,
    to: toToken.symbol,
    amount,
    address: address ? `${address.substring(0, 6)}...` : 'undefined'
  });
  
  // Check if Symbiosis supports this pair
  const isSupportedBySymbiosis = await isSymbiosisTokenPairSupported(fromToken, toToken, isTestnet);
  console.log(`Symbiosis support for ${fromToken.symbol}-${toToken.symbol}: ${isSupportedBySymbiosis}`);
  
  // Try to get quote from Symbiosis if address is available and pair is supported
  if (address && isSupportedBySymbiosis) {
    try {
      console.log("Getting Symbiosis quote");
      const quote = await getSymbiosisSwapQuote(fromToken, toToken, amount, address, isTestnet);
      if (quote) {
        console.log("Received Symbiosis quote:", quote);
        return ethers.utils.formatUnits(quote.amountOut, toToken.decimals || 18);
      }
    } catch (error) {
      console.error('Error getting Symbiosis quote:', error);
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
    if (!token.address) {
      throw new Error('Token address not available');
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
