
import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { Transaction, TransactionStatus } from "@/types"; // Updated import path
import { useWallet } from "@/context/walletContext";
import { useNetwork } from "@/context/networkContext";
import { getExplorerUrl } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory = ({ transactions }: TransactionHistoryProps) => {
  const { isTestnet } = useNetwork();
  const [isOpen, setIsOpen] = useState(true);

  // Status badge colors
  const getStatusClass = (status: TransactionStatus): string => {
    switch (status) {
      case "success":
        return "bg-green-500/20 text-green-500";
      case "error":
        return "bg-red-500/20 text-red-500";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Toggle transaction history visibility
  const toggleHistory = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="mt-6 bg-black/20 rounded-xl overflow-hidden transition-all">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-black/30"
        onClick={toggleHistory}
      >
        <h3 className="text-white font-medium">Transaction History</h3>
        <Button variant="ghost" size="sm" className="text-white/70">
          {isOpen ? "Hide" : "Show"}
        </Button>
      </div>
      
      {isOpen && (
        <div className="transition-all">
          {transactions.length === 0 ? (
            <div className="p-4 text-center text-white/50">
              No transactions yet
            </div>
          ) : (
            <div className="p-2 max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-white/70">Type</TableHead>
                    <TableHead className="text-white/70">Amount</TableHead>
                    <TableHead className="text-white/70">Status</TableHead>
                    <TableHead className="text-white/70">Date</TableHead>
                    <TableHead className="text-white/70 text-right">Explorer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium text-white">
                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      </TableCell>
                      <TableCell className="text-white">
                        {tx.data?.fromAmount} {tx.data?.fromToken} → {tx.data?.toAmount} {tx.data?.toToken}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(tx.status)}`}>
                          {tx.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-white/70">
                        {formatDate(tx.timestamp)}
                      </TableCell>
                      <TableCell className="text-right">
                        <a 
                          href={getExplorerUrl(tx.data?.chainId, tx.hash, isTestnet)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block text-unikron-blue hover:text-unikron-blue-light"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
