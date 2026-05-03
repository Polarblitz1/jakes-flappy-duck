import { useEffect, useState } from "react";
import FlappyDuck from "@/components/FlappyDuck";

const HS_KEY = "jakes_flappy_duck_hs";

const Index = () => {
  const [hs, setHs] = useState(0);

  useEffect(() => {
    const read = () => {
      const v = parseInt(localStorage.getItem(HS_KEY) || "0", 10);
      setHs(isNaN(v) ? 0 : v);
    };
    read();
    const id = window.setInterval(read, 500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="min-h-screen w-full bg-background flex flex-col items-center justify-center px-4 py-6 gap-5 overflow-hidden">
      <header className="flex flex-col items-center gap-3">
        <div className="bg-primary border-4 border-foreground pixel-shadow px-5 py-3">
          <h1 className="pixel-text text-[14px] sm:text-[18px] text-primary-foreground">
            JAKE'S FLAPPY DUCK
          </h1>
        </div>
        <div className="bg-card border-4 border-foreground pixel-shadow px-4 py-2">
          <p className="pixel-text text-[10px] text-foreground">
            HI-SCORE <span className="text-secondary ml-2">{String(hs).padStart(4, "0")}</span>
          </p>
        </div>
      </header>

      <FlappyDuck />

      <footer className="bg-card border-4 border-foreground pixel-shadow px-4 py-2">
        <p className="pixel-text text-[8px] text-muted-foreground">
          SPACE / TAP TO FLAP · DODGE THE PIPES
        </p>
      </footer>
    </main>
  );
};

export default Index;
