import { saveScore, getLeaderboard } from './leaderboard'

// Example: When the bird hits a pipe
function gameOver(finalScore) {
    const playerName = prompt("Enter your name for the leaderboard:");
    saveScore(playerName, finalScore); import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
