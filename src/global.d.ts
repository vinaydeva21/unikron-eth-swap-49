
interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
  };
  
  cardano?: {
    nami?: {
      enable: () => Promise<any>;
    };
    yoroi?: {
      enable: () => Promise<any>;
    };
  };
}
