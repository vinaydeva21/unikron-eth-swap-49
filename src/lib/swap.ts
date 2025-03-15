
import { toast } from 'sonner';
import { Token } from '@/lib/types';
import { getSigner } from './ethereum';
import { ethers } from 'ethers';

/**
 * Swap tokens using a decentralized exchange
 */
export const swapTokens = async (
  fromToken: Token,
  toToken: Token,
  amount: string,
  slippage: number
): Promise<boolean> => {
  try {
    toast.info(`Swapping ${amount} ${fromToken.symbol} for ${toToken.symbol}`);
    
    // This is just a placeholder for a real swap operation
    // In a real app, you would interact with a DEX contract
    const signer = getSigner();
    
    // Simulate a swap delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(`Successfully swapped for ${amount} ${toToken.symbol}`);
    return true;
  } catch (error) {
    console.error('Error swapping tokens:', error);
    toast.error(`Swap failed: ${(error as Error).message || 'Unknown error'}`);
    return false;
  }
};

/**
 * Calculate output amount based on input amount and token prices
 */
export const calculateOutputAmount = (
  fromToken: Token,
  toToken: Token,
  amount: string
): string => {
  if (!amount || amount === '0' || !fromToken.price || !toToken.price) {
    return '0';
  }
  
  const inputAmount = parseFloat(amount);
  const inputValue = inputAmount * fromToken.price;
  const outputAmount = inputValue / toToken.price;
  
  return outputAmount.toFixed(6);
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
    
    const amountInWei = ethers.utils.parseUnits(amount, token.decimals);
    
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
