
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  // Always set to dark mode for this app
  const [isDark, setIsDark] = useState(true);
  
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setIsDark(!isDark)}
      className="rounded-full bg-white/5 border-white/10 hover:bg-white/10"
    >
      {isDark ? (
        <Moon className="h-4 w-4 text-white/80" />
      ) : (
        <Sun className="h-4 w-4 text-white/80" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

export default ThemeToggle;
