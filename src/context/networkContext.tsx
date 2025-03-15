
import { createContext, useContext, useState, ReactNode } from 'react';

interface NetworkContextType {
  isTestnet: boolean;
  toggleTestnet: () => void;
}

export const NetworkContext = createContext<NetworkContextType>({
  isTestnet: false,
  toggleTestnet: () => {},
});

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider = ({ children }: NetworkProviderProps) => {
  const [isTestnet, setIsTestnet] = useState(false);

  const toggleTestnet = () => {
    setIsTestnet(prev => !prev);
  };

  return (
    <NetworkContext.Provider value={{ isTestnet, toggleTestnet }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
