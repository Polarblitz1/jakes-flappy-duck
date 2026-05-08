import { useCallback, useEffect, useState } from "react";
import FlappyDuck from "@/components/FlappyDuck";
import Leaderboard from "@/components/Leaderboard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, X } from "lucide-react";

const HS_KEY = "jakes_flappy_duck_hs";
const NAME_KEY = "jakes_flappy_duck_name";

// Simple profanity filter — replaces matches with ###
const BAD_WORDS = [
  "damn","hell","crap","stupid","idiot","moron","dumb","loser","suck","fuck","shit","bitch","ass","bastard","dick","piss","slut","whore","cock","cunt","retard","fag","nigga","nigger","chink","spic","kike","wetback","raghead","towelhead","honky","cracker","gook","kyke","coon","dyke","tranny",
];
const PROFANITY_RE = new RegExp(
  BAD_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "gi"
);
const filterProfanity = (text: string) =>
  text.replace(PROFANITY_RE, (m) => "#".repeat(m.length));

const Index = () => {
  const [hs, setHs] = useState(0);
  const [pendingScore, setPendingScore] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showBoard, setShowBoard] = useState(false);

  useEffect(() => {
    const read = () => {
      const v = parseInt(localStorage.getItem(HS_KEY) || "0", 10);
      setHs(isNaN(v) ? 0 : v);
    };
    read();
    const id = window.setInterval(read, 500);
    setName(localStorage.getItem(NAME_KEY) || "");
    return () => window.clearInterval(id);
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
    if (finalScore > 0) setPendingScore(finalScore);
  }, []);

  const submitScore = async () => {
    let trimmed = name.trim().toUpperCase().slice(0, 12);
    trimmed = filterProfanity(trimmed);
    if (!trimmed) {
      toast.error("Enter a name first!");
      return;
    }
    if (pendingScore == null) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("scores")
      .insert({ name: trimmed, score: pendingScore });
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit score");
      return;
    }
    localStorage.setItem(NAME_KEY, trimmed);
    toast.success("Score submitted!");
    setPendingScore(null);
    setRefreshKey((k) => k + 1);
    setShowBoard(true);
  };

  return (
    <main className="min-h-screen w-full bg-background flex flex-col items-center justify-start px-4 py-6 gap-5 overflow-x-hidden">
      <header className="flex flex-col items-center gap-3 w-full max-w-[400px]">
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

      <FlappyDuck onGameOver={handleGameOver} onOpenLeaderboard={() => setShowBoard(true)} />

      <footer className="bg-card border-4 border-foreground pixel-shadow px-4 py-2">
        <p className="pixel-text text-[8px] text-muted-foreground">
          SPACE / TAP TO FLAP · DODGE THE PIPES
        </p>
      </footer>


      {showBoard && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/70 px-4"
          onClick={() => setShowBoard(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowBoard(false)}
              aria-label="Close leaderboard"
              className="absolute -top-3 -right-3 bg-destructive border-4 border-foreground pixel-shadow p-1 hover:opacity-90 z-10"
            >
              <X className="w-4 h-4 text-destructive-foreground" />
            </button>
            <Leaderboard refreshKey={refreshKey} />
          </div>
        </div>
      )}

      {pendingScore != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 px-4">
          <div className="bg-card border-4 border-foreground pixel-shadow-lg p-5 w-full max-w-[320px] flex flex-col gap-4">
            <h2 className="pixel-text text-[12px] text-foreground text-center">
              NEW SCORE!
            </h2>
            <p className="pixel-text text-[20px] text-secondary text-center">
              {String(pendingScore).padStart(4, "0")}
            </p>
            <label className="pixel-text text-[8px] text-muted-foreground">
              ENTER NAME
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(filterProfanity(e.target.value.toUpperCase().slice(0, 12)))}
              maxLength={12}
              placeholder="DUCK"
              className="pixel-text text-[12px] bg-background text-foreground border-4 border-foreground px-3 py-2 outline-none uppercase"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingScore(null)}
                className="flex-1 bg-card border-4 border-foreground pixel-shadow pixel-text text-[10px] text-foreground py-2 hover:bg-muted"
              >
                SKIP
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={submitScore}
                className="flex-1 bg-primary border-4 border-foreground pixel-shadow pixel-text text-[10px] text-primary-foreground py-2 hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "..." : "SUBMIT"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Index;
