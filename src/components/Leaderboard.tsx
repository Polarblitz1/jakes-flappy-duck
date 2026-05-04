import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Score = { id: string; name: string; score: number; created_at: string };

export default function Leaderboard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("scores")
        .select("id, name, score, created_at")
        .order("score", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(10);
      if (!cancelled) {
        setScores((data as Score[]) || []);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <section className="bg-card border-4 border-foreground pixel-shadow px-4 py-3 w-full max-w-[360px]">
      <h2 className="pixel-text text-[10px] text-foreground text-center mb-3">
        🏆 GLOBAL TOP 10
      </h2>
      {loading ? (
        <p className="pixel-text text-[8px] text-muted-foreground text-center py-2">LOADING…</p>
      ) : scores.length === 0 ? (
        <p className="pixel-text text-[8px] text-muted-foreground text-center py-2">
          NO SCORES YET
        </p>
      ) : (
        <ol className="flex flex-col gap-1">
          {scores.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-2 pixel-text text-[8px] text-foreground border-b-2 border-foreground/20 pb-1 last:border-b-0"
            >
              <span className="w-5 text-secondary">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex-1 truncate">{s.name}</span>
              <span className="text-primary-foreground bg-primary px-2 py-0.5">
                {String(s.score).padStart(4, "0")}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
