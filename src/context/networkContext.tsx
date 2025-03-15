
import { createContext, useContext, useState, ReactNode } from 'react';
import { Network } from '@/lib/types';
import { NETWORKS } from '@/lib/constants';

interface NetworkContextType {
  isTestnet: boolean;
  toggleTestnet: () => void;
  selectedNetwork: Network | null;
  setSelectedNetwork: (network: Network) => void;
}

export const NetworkContext = createContext<NetworkContextType>({
  isTestnet: false,
  toggleTestnet: () => {},
  selectedNetwork: null,
  setSelectedNetwork: () => {},
});

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider = ({ children }: NetworkProviderProps) => {
  const [isTestnet, setIsTestnet] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(NETWORKS[0]); // Default to first network

  const toggleTestnet = () => {
    setIsTestnet(prev => !prev);
  };

  return (
    <NetworkContext.Provider value={{ 
      isTestnet, 
      toggleTestnet, 
      selectedNetwork, 
      setSelectedNetwork 
    }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
