import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("ecopower-theme");
    setLight(stored === "light");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
    window.localStorage.setItem("ecopower-theme", light ? "light" : "dark");
  }, [light]);

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle color theme"
      onClick={() => setLight((v) => !v)}
    >
      {light ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
