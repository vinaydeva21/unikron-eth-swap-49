
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { Token } from '@/lib/types';

// ABI for our swap contract - simplified version
const SWAP_CONTRACT_ABI = [
  "function swap(address _tokenIn, address _tokenOut, uint256 _amountIn, uint256 _minAmountOut, uint256 _price) external returns (uint256)",
  "function feePercent() view returns (uint256)"
];

// Contract addresses for different networks
const CONTRACT_ADDRESSES: { [key: string]: string } = {
  ethereum: "0x0000000000000000000000000000000000000000", // Replace with actual deployed address
  arbitrum: "0x0000000000000000000000000000000000000000", // Replace with actual deployed address
  // Cardano would need a different approach
};

// For testing, you can use Goerli testnet
const TESTNET_ADDRESSES: { [key: string]: string } = {
  ethereum: "0x0000000000000000000000000000000000000000", // Replace with testnet address
  arbitrum: "0x0000000000000000000000000000000000000000", // Replace with testnet address
};

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
    const networkId = fromToken.network;
    if (!networkId || !['ethereum', 'arbitrum'].includes(networkId)) {
      toast.error(`Swaps not supported on ${networkId || 'unknown'} network`);
      return false;
    }
    
    // Get contract address based on network and environment
    const contractAddresses = isTestnet ? TESTNET_ADDRESSES : CONTRACT_ADDRESSES;
    const contractAddress = contractAddresses[networkId];
    
    if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000") {
      toast.error(`Swap contract not deployed on ${networkId} ${isTestnet ? 'testnet' : 'mainnet'}`);
      return false;
    }
    
    // Connect to provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    
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
      await approveTx.wait();
      toast.success("Token transfer approved");
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
    
    // Wait for transaction to be mined
    await tx.wait();
    
    toast.success(`Successfully swapped ${amount} ${fromToken.symbol} for ${toToken.symbol}`);
    return true;
  } catch (error) {
    console.error("Error executing swap:", error);
    toast.error(`Swap failed: ${(error as Error).message || "Unknown error"}`);
    return false;
  }
};

/**
 * Check if swap is available for the current network
 */
export const isSwapAvailable = (networkId: string): boolean => {
  return ['ethereum', 'arbitrum'].includes(networkId);
};
