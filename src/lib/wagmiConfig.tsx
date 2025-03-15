
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultWallets, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import { mainnet, arbitrum } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';

// Configure the available chains and providers
const { chains, publicClient } = configureChains(
  [mainnet, arbitrum],
  [
    // Use Alchemy as the primary provider when available, fallback to public provider
    alchemyProvider({ apiKey: 'YourAlchemyApiKey' }),
    publicProvider()
  ]
);

// Get the wallets from RainbowKit
const { connectors } = getDefaultWallets({
  appName: 'UNIKRON Swap',
  projectId: 'unikronswap', // This is a placeholder - in production, use a proper project ID
  chains
});

// Create the wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

// Export a provider component for wrapping the app
export const WalletProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider 
        chains={chains} 
        theme={darkTheme({
          accentColor: '#1a44b7', // Unikron blue
          accentColorForeground: 'white',
          borderRadius: 'medium',
          fontStack: 'system',
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export { chains };
