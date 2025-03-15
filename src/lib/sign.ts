
import { ethers } from 'ethers';
import { getSigner } from './ethereum';

/**
 * Sign a message using the user's wallet
 */
export const signMessage = async (message: string): Promise<string> => {
  try {
    const signer = getSigner();
    return await signer.signMessage(message);
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
};

/**
 * Verify a signature
 */
export const verifySignature = (
  message: string,
  signature: string,
  address: string
): boolean => {
  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

/**
 * Sign typed data according to EIP-712
 */
export const signTypedData = async (
  domain: any,
  types: any,
  value: any
): Promise<string> => {
  try {
    const signer = getSigner();
    // @ts-ignore - ethers v5 has different type signatures
    return await signer._signTypedData(domain, types, value);
  } catch (error) {
    console.error('Error signing typed data:', error);
    throw error;
  }
};
