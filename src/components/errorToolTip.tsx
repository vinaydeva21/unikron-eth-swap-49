
import { AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ErrorTooltipProps {
  message: string;
}

const ErrorTooltip = ({ message }: ErrorTooltipProps) => {
  if (!message) return null;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-red-500 text-white border-none">
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ErrorTooltip;
