import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Minimize2, Trophy } from "lucide-react";

const W = 400;
const H = 600;
const GRAVITY = 0.45;
const FLAP = -7.5;
const PIPE_W = 60;
const GAP = 160;
const PIPE_SPEED = 2.2;
const SPAWN_MS = 1500;
const DUCK_X = 90;
const DUCK_R = 16;
const GROUND_H = 60;

type Pipe = { x: number; topH: number; passed: boolean };
type State = "idle" | "playing" | "dead";

const HS_KEY = "jakes_flappy_duck_hs";

export default function FlappyDuck({ onGameOver, onOpenLeaderboard }: { onGameOver?: (score: number) => void; onOpenLeaderboard?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onGameOverRef = useRef(onGameOver);
  useEffect(() => {
    onGameOverRef.current = onGameOver;
  }, [onGameOver]);
  const stateRef = useRef<State>("idle");
  const [, force] = useState(0);
  const yRef = useRef(H / 2);
  const vRef = useRef(0);
  const pipesRef = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [hs, setHs] = useState(0);
  const lastSpawnRef = useRef(0);
  const tiltRef = useRef(0);
  const groundOffRef = useRef(0);
  const frameRef = useRef(0);
  const finalScoreRef = useRef(0);
  const usedReviveRef = useRef(false);

  type Quiz = { a: number; b: number; options: number[]; correct: number };
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizTime, setQuizTime] = useState(10);
  const quizRef = useRef<Quiz | null>(null);
  useEffect(() => { quizRef.current = quiz; }, [quiz]);

  const startQuiz = useCallback(() => {
    const a = 1 + Math.floor(Math.random() * 12);
    const b = 1 + Math.floor(Math.random() * 12);
    const correct = a * b;
    const opts = new Set<number>([correct]);
    while (opts.size < 3) {
      const delta = (Math.floor(Math.random() * 9) + 1) * (Math.random() < 0.5 ? -1 : 1);
      const w = correct + delta;
      if (w > 0) opts.add(w);
    }
    const options = Array.from(opts).sort(() => Math.random() - 0.5);
    setQuiz({ a, b, options, correct });
    setQuizTime(10);
  }, []);

  const failQuiz = useCallback(() => {
    setQuiz(null);
    onGameOverRef.current?.(finalScoreRef.current);
    force((n) => n + 1);
  }, []);

  const reviveFromQuiz = useCallback(() => {
    setQuiz(null);
    usedReviveRef.current = true;
    yRef.current = H / 2;
    vRef.current = 0;
    pipesRef.current = [];
    lastSpawnRef.current = 0;
    tiltRef.current = 0;
    stateRef.current = "playing";
    force((n) => n + 1);
  }, []);

  const answerQuiz = useCallback((value: number) => {
    const q = quizRef.current;
    if (!q) return;
    if (value === q.correct) reviveFromQuiz();
    else failQuiz();
  }, [reviveFromQuiz, failQuiz]);

  useEffect(() => {
    if (!quiz) return;
    const id = window.setInterval(() => {
      setQuizTime((t) => {
        if (t <= 1) {
          window.clearInterval(id);
          failQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [quiz, failQuiz]);

  useEffect(() => {
    const v = parseInt(localStorage.getItem(HS_KEY) || "0", 10);
    setHs(isNaN(v) ? 0 : v);
  }, []);

  const reset = useCallback(() => {
    yRef.current = H / 2;
    vRef.current = 0;
    pipesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    lastSpawnRef.current = 0;
    tiltRef.current = 0;
    usedReviveRef.current = false;
  }, []);

  const flap = useCallback(() => {
    if (quizRef.current) return;
    if (stateRef.current === "idle") {
      reset();
      stateRef.current = "playing";
      force((n) => n + 1);
    }
    if (stateRef.current === "playing") {
      vRef.current = FLAP;
    } else if (stateRef.current === "dead") {
      stateRef.current = "idle";
      reset();
      force((n) => n + 1);
    }
  }, [reset]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flap]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let last = performance.now();

    const drawCloud = (x: number, y: number, s: number) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y, 24 * s, 8 * s);
      ctx.fillRect(x + 6 * s, y - 6 * s, 18 * s, 8 * s);
      ctx.fillRect(x + 4 * s, y + 6 * s, 22 * s, 6 * s);
    };

    const drawPipe = (x: number, topH: number) => {
      const pipe = "hsl(110 65% 35%)";
      const dark = "hsl(110 70% 25%)";
      const light = "hsl(110 55% 50%)";
      ctx.fillStyle = pipe;
      ctx.fillRect(x, 0, PIPE_W, topH);
      ctx.fillStyle = light;
      ctx.fillRect(x + 6, 0, 6, topH);
      ctx.fillStyle = dark;
      ctx.fillRect(x + PIPE_W - 8, 0, 8, topH);
      ctx.fillStyle = pipe;
      ctx.fillRect(x - 4, topH - 22, PIPE_W + 8, 22);
      ctx.fillStyle = light;
      ctx.fillRect(x - 4 + 6, topH - 22, 6, 22);
      ctx.fillStyle = dark;
      ctx.fillRect(x + PIPE_W - 8, topH - 22, 12, 22);
      ctx.fillStyle = "hsl(30 30% 15%)";
      ctx.fillRect(x - 4, topH - 22, PIPE_W + 8, 3);
      ctx.fillRect(x - 4, topH - 4, PIPE_W + 8, 4);

      const by = topH + GAP;
      ctx.fillStyle = pipe;
      ctx.fillRect(x, by, PIPE_W, H - by - GROUND_H);
      ctx.fillStyle = light;
      ctx.fillRect(x + 6, by, 6, H - by - GROUND_H);
      ctx.fillStyle = dark;
      ctx.fillRect(x + PIPE_W - 8, by, 8, H - by - GROUND_H);
      ctx.fillStyle = pipe;
      ctx.fillRect(x - 4, by, PIPE_W + 8, 22);
      ctx.fillStyle = light;
      ctx.fillRect(x - 4 + 6, by, 6, 22);
      ctx.fillStyle = dark;
      ctx.fillRect(x + PIPE_W - 8, by, 12, 22);
      ctx.fillStyle = "hsl(30 30% 15%)";
      ctx.fillRect(x - 4, by, PIPE_W + 8, 3);
      ctx.fillRect(x - 4, by + 18, PIPE_W + 8, 4);
    };

    const drawDuck = (y: number, tilt: number, flapping: boolean) => {
      ctx.save();
      ctx.translate(DUCK_X, y);
      ctx.rotate(tilt);
      const yellow = "hsl(50 100% 55%)";
      const yellowD = "hsl(45 90% 45%)";
      const beak = "hsl(25 95% 55%)";
      const beakD = "hsl(20 90% 40%)";
      const blk = "hsl(30 30% 15%)";
      const wht = "#ffffff";
      ctx.fillStyle = blk;
      ctx.fillRect(-18, -12, 36, 24);
      ctx.fillRect(-14, -16, 28, 4);
      ctx.fillRect(-14, 12, 28, 4);
      ctx.fillStyle = yellow;
      ctx.fillRect(-16, -12, 32, 24);
      ctx.fillRect(-12, -14, 24, 2);
      ctx.fillRect(-12, 12, 24, 2);
      ctx.fillStyle = yellowD;
      ctx.fillRect(-12, 4, 22, 8);
      ctx.fillStyle = wht;
      ctx.fillRect(4, -8, 8, 8);
      ctx.fillStyle = blk;
      ctx.fillRect(4, -8, 8, 2);
      ctx.fillRect(4, -8, 2, 8);
      ctx.fillRect(10, -8, 2, 8);
      ctx.fillRect(4, -2, 8, 2);
      ctx.fillStyle = blk;
      ctx.fillRect(8, -6, 4, 4);
      ctx.fillStyle = beakD;
      ctx.fillRect(12, -2, 12, 8);
      ctx.fillStyle = beak;
      ctx.fillRect(12, -2, 12, 4);
      ctx.fillStyle = blk;
      ctx.fillRect(12, -2, 12, 1);
      ctx.fillRect(12, 5, 12, 1);
      ctx.fillRect(23, -2, 1, 8);
      ctx.fillRect(12, 1, 12, 1);
      const wingY = flapping ? -6 : 2;
      ctx.fillStyle = blk;
      ctx.fillRect(-12, wingY, 16, 10);
      ctx.fillStyle = yellowD;
      ctx.fillRect(-10, wingY + 1, 12, 8);
      ctx.fillStyle = yellow;
      ctx.fillRect(-10, wingY + 1, 12, 3);
      ctx.restore();
    };

    const draw = () => {
      const grad = ctx.createLinearGradient(0, 0, 0, H - GROUND_H);
      grad.addColorStop(0, "hsl(200 75% 70%)");
      grad.addColorStop(1, "hsl(200 70% 60%)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H - GROUND_H);

      drawCloud(((frameRef.current * 0.3) % (W + 60)) - 30, 80, 2);
      drawCloud(((frameRef.current * 0.2 + 200) % (W + 60)) - 30, 160, 1.5);
      drawCloud(((frameRef.current * 0.25 + 100) % (W + 60)) - 30, 240, 1.8);

      for (const p of pipesRef.current) drawPipe(p.x, p.topH);

      ctx.fillStyle = "hsl(110 55% 40%)";
      ctx.fillRect(0, H - GROUND_H, W, 12);
      ctx.fillStyle = "hsl(110 55% 30%)";
      const off = groundOffRef.current % 16;
      for (let i = -1; i < W / 16 + 1; i++) {
        ctx.fillRect(i * 16 - off, H - GROUND_H + 8, 8, 4);
      }
      ctx.fillStyle = "hsl(35 60% 35%)";
      ctx.fillRect(0, H - GROUND_H + 12, W, GROUND_H - 12);
      ctx.fillStyle = "hsl(35 60% 25%)";
      for (let i = 0; i < W; i += 24) {
        ctx.fillRect(i - off, H - 24, 8, 4);
        ctx.fillRect(i + 12 - off, H - 14, 6, 4);
      }
      ctx.fillStyle = "hsl(30 30% 15%)";
      ctx.fillRect(0, H - GROUND_H, W, 3);

      drawDuck(yRef.current, tiltRef.current, Math.floor(frameRef.current / 6) % 2 === 0);

      if (stateRef.current === "playing") {
        ctx.font = "32px 'Press Start 2P', monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "hsl(30 30% 15%)";
        ctx.fillText(String(scoreRef.current), W / 2 + 3, 80 + 3);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(String(scoreRef.current), W / 2, 80);
      }
    };

    const collide = () => {
      const y = yRef.current;
      if (y + DUCK_R >= H - GROUND_H) return true;
      if (y - DUCK_R <= 0) return true;
      for (const p of pipesRef.current) {
        if (DUCK_X + DUCK_R > p.x && DUCK_X - DUCK_R < p.x + PIPE_W) {
          if (y - DUCK_R < p.topH || y + DUCK_R > p.topH + GAP) return true;
        }
      }
      return false;
    };

    const loop = (t: number) => {
      const dt = Math.min(32, t - last);
      last = t;
      const scale = dt / 16.667;
      frameRef.current += scale;

      if (stateRef.current === "playing") {
        groundOffRef.current += PIPE_SPEED * scale;
        vRef.current += GRAVITY * scale;
        yRef.current += vRef.current * scale;
        tiltRef.current = Math.max(-0.4, Math.min(1.2, vRef.current * 0.08));

        lastSpawnRef.current += dt;
        if (lastSpawnRef.current >= SPAWN_MS) {
          lastSpawnRef.current = 0;
          const minTop = 60;
          const maxTop = H - GROUND_H - GAP - 60;
          const topH = minTop + Math.random() * (maxTop - minTop);
          pipesRef.current.push({ x: W + 20, topH, passed: false });
        }
        for (const p of pipesRef.current) {
          p.x -= PIPE_SPEED * scale;
          if (!p.passed && p.x + PIPE_W < DUCK_X) {
            p.passed = true;
            scoreRef.current++;
            setScore(scoreRef.current);
          }
        }
        pipesRef.current = pipesRef.current.filter((p) => p.x + PIPE_W > -10);

        if (collide()) {
          stateRef.current = "dead";
          const final = scoreRef.current;
          finalScoreRef.current = final;
          setHs((prev) => {
            if (final > prev) {
              localStorage.setItem(HS_KEY, String(final));
              return final;
            }
            return prev;
          });
          if (!usedReviveRef.current) {
            startQuiz();
          } else {
            onGameOverRef.current?.(final);
          }
          force((n) => n + 1);
        }
      } else if (stateRef.current === "idle") {
        groundOffRef.current += PIPE_SPEED * scale;
        yRef.current = H / 2 + Math.sin(frameRef.current * 0.08) * 8;
        tiltRef.current = 0;
      } else {
        if (yRef.current + DUCK_R < H - GROUND_H) {
          vRef.current += GRAVITY * scale;
          yRef.current += vRef.current * scale;
          tiltRef.current = Math.min(1.4, tiltRef.current + 0.05 * scale);
        }
      }

      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const state = stateRef.current;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [isFs, setIsFs] = useState(false);
  const [vp, setVp] = useState({ w: typeof window !== "undefined" ? window.innerWidth : 800, h: typeof window !== "undefined" ? window.innerHeight : 600 });

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    const onFs = () => setIsFs(!!document.fullscreenElement);
    window.addEventListener("resize", onResize);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  const size = useMemo(() => {
    const padW = isFs ? 0 : 32;
    const padH = isFs ? 0 : 220;
    const availW = vp.w - padW;
    const availH = vp.h - padH;
    const ratio = W / H;
    let w = availW;
    let h = w / ratio;
    if (h > availH) {
      h = availH;
      w = h * ratio;
    }
    return { w: Math.max(280, Math.floor(w)), h: Math.max(420, Math.floor(h)) };
  }, [vp, isFs]);

  const toggleFs = useCallback(async () => {
    const el = wrapRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`relative select-none ${isFs ? "bg-background flex items-center justify-center w-screen h-screen" : ""}`}
      style={isFs ? undefined : { width: size.w }}
      onMouseDown={(e) => { e.preventDefault(); flap(); }}
      onTouchStart={(e) => { e.preventDefault(); flap(); }}
    >
      <div className="relative" style={{ width: size.w, height: size.h }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block border-4 border-foreground pixel-shadow-lg bg-background cursor-pointer"
          style={{ imageRendering: "pixelated", width: size.w, height: size.h }}
        />
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); toggleFs(); }}
          className="absolute top-2 right-2 bg-card border-2 border-foreground pixel-shadow p-2 hover:bg-primary hover:text-primary-foreground transition-colors"
          aria-label={isFs ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFs ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {state === "idle" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="bg-card border-4 border-foreground pixel-shadow px-5 py-4">
            <h1 className="pixel-text text-[18px] leading-tight text-foreground">
              JAKE'S<br />FLAPPY DUCK
            </h1>
          </div>
          <div className="bg-primary border-4 border-foreground pixel-shadow px-4 py-3 flex items-center gap-3 pointer-events-auto">
            <p className="pixel-text text-[10px] text-primary-foreground">TAP / SPACE TO FLAP</p>
            {onOpenLeaderboard && (
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLeaderboard();
                }}
                aria-label="Open leaderboard"
                className="bg-secondary border-2 border-foreground pixel-shadow p-1.5 hover:opacity-90"
              >
                <Trophy className="w-4 h-4 text-secondary-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      {state === "dead" && !quiz && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="bg-destructive border-4 border-foreground pixel-shadow px-5 py-3">
            <p className="pixel-text text-[14px] text-destructive-foreground">GAME OVER</p>
          </div>
          <div className="bg-card border-4 border-foreground pixel-shadow px-5 py-4 flex flex-col gap-2">
            <p className="pixel-text text-[10px] text-muted-foreground">SCORE</p>
            <p className="pixel-text text-[20px] text-foreground">{score}</p>
            <div className="h-[2px] bg-foreground my-1" />
            <p className="pixel-text text-[10px] text-muted-foreground">BEST</p>
            <p className="pixel-text text-[16px] text-secondary">{hs}</p>
          </div>
          <div className="bg-primary border-4 border-foreground pixel-shadow px-4 py-3 animate-pulse">
            <p className="pixel-text text-[10px] text-primary-foreground">TAP TO RETRY</p>
          </div>
        </div>
      )}

      {quiz && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center bg-foreground/70"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-destructive border-4 border-foreground pixel-shadow px-4 py-2">
            <p className="pixel-text text-[10px] text-destructive-foreground">REVIVE QUIZ · {quizTime}s</p>
          </div>
          <div className="bg-card border-4 border-foreground pixel-shadow px-5 py-4">
            <p className="pixel-text text-[20px] text-foreground">{quiz.a} × {quiz.b} = ?</p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-[240px]">
            {quiz.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={(e) => { e.stopPropagation(); answerQuiz(opt); }}
                className="bg-primary border-4 border-foreground pixel-shadow pixel-text text-[14px] text-primary-foreground py-3 hover:opacity-90"
              >
                {opt}
              </button>
            ))}
          </div>
          <p className="pixel-text text-[8px] text-background">CORRECT = REVIVE!</p>
        </div>
      )}
    </div>
  );
}
