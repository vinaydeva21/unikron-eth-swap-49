import { ethers } from 'ethers';
import { toast } from 'sonner';
import { Token } from '@/lib/types';
import { CONTRACT_ADDRESSES } from '@/config';

// ABI for our swap contract - simplified version
const SWAP_CONTRACT_ABI = [
  "function swap(address _tokenIn, address _tokenOut, uint256 _amountIn, uint256 _minAmountOut, uint256 _price) external returns (uint256)",
  "function feePercent() view returns (uint256)",
  "event SwapCompleted(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut)"
];

// Track active transactions
interface TransactionState {
  hash: string;
  status: 'pending' | 'success' | 'error';
  fromToken: Token;
  toToken: Token;
  amount: string;
}

let currentTransaction: TransactionState | null = null;

/**
 * Execute a token swap through the smart contract
 */
export const executeContractSwap = async (
  fromToken: Token,
  toToken: Token,
  amount: string,
  slippage: number,
  isTestnet: boolean = false
): Promise<boolean> => {
  try {
    // Make sure we have ethereum provider
    if (!window.ethereum) {
      toast.error("No Ethereum wallet detected. Please install MetaMask or another wallet.");
      return false;
    }
    
    // Get network ID
    const networkId = isTestnet ? 'sepolia' : fromToken.network;
    if (!networkId || !['ethereum', 'arbitrum', 'sepolia'].includes(networkId)) {
      toast.error(`Swaps not supported on ${networkId || 'unknown'} network`);
      return false;
    }
    
    // Get contract address based on network
    const contractAddress = CONTRACT_ADDRESSES[networkId]?.swap;
    
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      toast.error(`Swap contract not deployed on ${networkId}`);
      return false;
    }
    
    // Connect to provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
    // Check if we need to switch networks
    const chainId = isTestnet ? 11155111 : fromToken.chainId; // Sepolia chainId
    const currentChainId = await provider.getNetwork().then(net => net.chainId);
    
    // If we're on the wrong network, prompt switch
    if (chainId && currentChainId !== chainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x' + chainId.toString(16) }],
        });
        
        // Reload provider after network switch
        return executeContractSwap(fromToken, toToken, amount, slippage, isTestnet);
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          toast.error("Please add this network to your wallet first");
        } else {
          toast.error("Failed to switch networks");
        }
        return false;
      }
    }
    
    // Create contract instance
    const swapContract = new ethers.Contract(
      contractAddress,
      SWAP_CONTRACT_ABI,
      signer
    );
    
    // Check if token addresses exist
    if (!fromToken.address || !toToken.address) {
      toast.error("Token addresses not available");
      return false;
    }
    
    // Convert amount to wei
    const amountInWei = ethers.utils.parseUnits(amount, fromToken.decimals);
    
    // Calculate price ratio (simplified for demo)
    const fromPrice = fromToken.price || 1;
    const toPrice = toToken.price || 1;
    const priceRatio = ethers.utils.parseEther((fromPrice / toPrice).toString());
    
    // Calculate minimum output with slippage
    const expectedOutput = Number(amount) * (fromPrice / toPrice);
    const minAmountOut = ethers.utils.parseUnits(
      (expectedOutput * (1 - slippage / 100)).toFixed(toToken.decimals),
      toToken.decimals
    );
    
    // Before executing the swap, we need to approve the contract to spend tokens
    const tokenContract = new ethers.Contract(
      fromToken.address,
      [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function allowance(address owner, address spender) external view returns (uint256)"
      ],
      signer
    );
    
    // Check current allowance
    const userAddress = await signer.getAddress();
    const currentAllowance = await tokenContract.allowance(userAddress, contractAddress);
    
    // If allowance is insufficient, request approval
    if (currentAllowance.lt(amountInWei)) {
      const approveTx = await tokenContract.approve(contractAddress, amountInWei);
      toast.info("Approving token transfer...");
      
      // Wait for approval transaction to be mined
      const approveReceipt = await approveTx.wait();
      if (approveReceipt.status === 1) {
        toast.success("Token transfer approved");
      } else {
        toast.error("Token approval failed");
        return false;
      }
    }
    
    // Execute the swap
    toast.info("Executing swap...");
    const tx = await swapContract.swap(
      fromToken.address,
      toToken.address,
      amountInWei,
      minAmountOut,
      priceRatio
    );
    
    // Set current transaction state
    currentTransaction = {
      hash: tx.hash,
      status: 'pending',
      fromToken,
      toToken,
      amount
    };
    
    // Get the network prefix for the explorer URL
    const networkPrefix = isTestnet ? 'sepolia.' : '';
    
    // Show transaction hash as a toast
    toast.info(`Transaction sent! View on explorer: ${tx.hash.substring(0, 6)}...${tx.hash.substring(tx.hash.length - 4)}`, {
      action: {
        label: "View",
        onClick: () => window.open(`https://${networkPrefix}etherscan.io/tx/${tx.hash}`, '_blank')
      }
    });
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      // Transaction successful
      currentTransaction = { ...currentTransaction, status: 'success' };
      
      // Find the SwapCompleted event
      const swapEvent = receipt.events?.find(
        (event: any) => event.event === 'SwapCompleted'
      );
      
      let outputAmount = '0';
      if (swapEvent) {
        outputAmount = ethers.utils.formatUnits(
          swapEvent.args.amountOut,
          toToken.decimals
        );
      }
      
      // Using proper toast format
      toast.success(`Swapped ${amount} ${fromToken.symbol} for ${outputAmount} ${toToken.symbol}`, {
        action: {
          label: "View",
          onClick: () => window.open(`https://${networkPrefix}etherscan.io/tx/${receipt.transactionHash}`, '_blank')
        }
      });
      return true;
    } else {
      // Transaction failed
      currentTransaction = { ...currentTransaction, status: 'error' };
      toast.error(`Swap transaction failed. Please check block explorer for details.`);
      return false;
    }
  } catch (error) {
    console.error("Error executing swap:", error);
    toast.error(`Swap failed: ${(error as Error).message || "Unknown error"}`);
    
    if (currentTransaction) {
      currentTransaction = { ...currentTransaction, status: 'error' };
    }
    
    return false;
  }
};

/**
 * Get the status of the current transaction
 */
export const getCurrentTransactionStatus = (): 'pending' | 'success' | 'error' | null => {
  return currentTransaction?.status || null;
};

/**
 * Reset the current transaction state
 */
export const resetTransactionState = (): void => {
  currentTransaction = null;
};

/**
 * Check if swap is available for the current network
 */
export const isSwapAvailable = (networkId: string): boolean => {
  return ['ethereum', 'arbitrum', 'sepolia'].includes(networkId);
};
