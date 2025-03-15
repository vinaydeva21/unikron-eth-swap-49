
import { ethers } from 'ethers';

/**
 * Get the Ethereum provider from the window object
 */
export const getProvider = () => {
  if (!window.ethereum) {
    throw new Error('No Ethereum provider found. Please install a wallet.');
  }
  
  return new ethers.providers.Web3Provider(window.ethereum);
};

/**
 * Get the signer from the provider
 */
export const getSigner = () => {
  const provider = getProvider();
  return provider.getSigner();
};

/**
 * Request the user's accounts
 */
export const requestAccounts = async (): Promise<string[]> => {
  if (!window.ethereum) {
    throw new Error('No Ethereum provider found. Please install a wallet.');
  }
  
  return window.ethereum.request({ method: 'eth_requestAccounts' });
};

/**
 * Check if wallet is connected
 */
export const isWalletConnected = async (): Promise<boolean> => {
  try {
    if (!window.ethereum) return false;
    
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts && accounts.length > 0;
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return false;
  }
};

/**
 * Get the current chain ID
 */
export const getChainId = async (): Promise<number> => {
  if (!window.ethereum) {
    throw new Error('No Ethereum provider found. Please install a wallet.');
  }
  
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  return parseInt(chainId as string, 16);
};

/**
 * Format address for display
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
