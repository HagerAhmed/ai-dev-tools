import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Single-file React Snake Game
// Usage: drop this component into a Create React App / Vite project.
// Tailwind CSS is used for styling (classes included). Framer Motion is used for subtle UI animation.

export default function SnakeGame() {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem("snake_high_score") || 0);
    } catch {
      return 0;
    }
  });
  const [speed, setSpeed] = useState(8); // frames per second
  const [gridSize] = useState(20); // pixels per cell
  const [direction, setDirection] = useState({ x: 1, y: 0 });
  const [snake, setSnake] = useState(() => [ { x: 8, y: 8 } ]);
  const [food, setFood] = useState(() => ({ x: 12, y: 8 }));
  const [colsRows, setColsRows] = useState({ cols: 24, rows: 24 });
  const frameRef = useRef(null);
  const lastTickRef = useRef(0);
  const touchStartRef = useRef(null);

  // helper - random food position not occupying the snake
  function randomFoodPosition(cols, rows, snakeArr) {
    const taken = new Set(snakeArr.map((s) => `${s.x}:${s.y}`));
    let tries = 0;
    while (tries < 10000) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows);
      if (!taken.has(`${x}:${y}`)) return { x, y };
      tries++;
    }
    return { x: 0, y: 0 };
  }

  // Reset game
  function resetGame() {
    const start = [{ x: Math.floor(colsRows.cols / 2), y: Math.floor(colsRows.rows / 2) }];
    setSnake(start);
    setDirection({ x: 1, y: 0 });
    setFood(randomFoodPosition(colsRows.cols, colsRows.rows, start));
    setScore(0);
    setIsRunning(false);
  }

  // Save high score
  useEffect(() => {
    try {
      localStorage.setItem("snake_high_score", String(highScore));
    } catch {}
  }, [highScore]);

  // keyboard controls
  useEffect(() => {
    function handleKey(e) {
      const key = e.key;
      if (key === "ArrowUp" || key === "w" || key === "W") setDirection((d) => (d.y === 1 ? d : { x: 0, y: -1 }));
      if (key === "ArrowDown" || key === "s" || key === "S") setDirection((d) => (d.y === -1 ? d : { x: 0, y: 1 }));
      if (key === "ArrowLeft" || key === "a" || key === "A") setDirection((d) => (d.x === 1 ? d : { x: -1, y: 0 }));
      if (key === "ArrowRight" || key === "d" || key === "D") setDirection((d) => (d.x === -1 ? d : { x: 1, y: 0 }));
      if (key === " ") setIsRunning((r) => !r); // space toggles
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // touch controls for mobile (swipe)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function start(e) {
      const t = e.touches ? e.touches[0] : e;
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    }
    function end(e) {
      if (!touchStartRef.current) return;
      const t = e.changedTouches ? e.changedTouches[0] : e;
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const threshold = 20;
      if (Math.max(absX, absY) < threshold) return;
      if (absX > absY) {
        // horizontal
        setDirection((d) => (dx > 0 ? (d.x === -1 ? d : { x: 1, y: 0 }) : (d.x === 1 ? d : { x: -1, y: 0 })));
      } else {
        // vertical
        setDirection((d) => (dy > 0 ? (d.y === -1 ? d : { x: 0, y: 1 }) : (d.y === 1 ? d : { x: 0, y: -1 })));
      }
      touchStartRef.current = null;
    }
    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchend", end);
    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mouseup", end);
    return () => {
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchend", end);
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mouseup", end);
    };
  }, [colsRows]);

  // Responsive canvas sizing
  useEffect(() => {
    function resize() {
      const container = canvasRef.current?.parentElement;
      if (!canvasRef.current || !container) return;
      const maxWidth = Math.min(container.clientWidth - 24, 720);
      const cols = Math.floor(maxWidth / gridSize) || 10;
      const rows = cols; // square grid
      setColsRows({ cols, rows });
      canvasRef.current.width = cols * gridSize;
      canvasRef.current.height = rows * gridSize;
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [gridSize]);

  // Game loop via requestAnimationFrame
  useEffect(() => {
    function tick(now) {
      if (!lastTickRef.current) lastTickRef.current = now;
      const secondsPerFrame = 1 / speed;
      const delta = (now - lastTickRef.current) / 1000;
      if (isRunning && delta >= secondsPerFrame) {
        lastTickRef.current = now - ((delta % secondsPerFrame) * 1000);
        setSnake((prev) => {
          const head = { x: prev[0].x + direction.x, y: prev[0].y + direction.y };
          // wrap-around behavior
          head.x = (head.x + colsRows.cols) % colsRows.cols;
          head.y = (head.y + colsRows.rows) % colsRows.rows;

          // collision with self
          if (prev.some((s) => s.x === head.x && s.y === head.y)) {
            // game over
            setIsRunning(false);
            setHighScore((h) => Math.max(h, score));
            return prev; // freeze snake
          }

          let grew = false;
          if (head.x === food.x && head.y === food.y) {
            grew = true;
            setScore((s) => s + 1);
            const newFood = randomFoodPosition(colsRows.cols, colsRows.rows, prev.concat([head]));
            setFood(newFood);
          }

          const newSnake = [head, ...prev];
          if (!grew) newSnake.pop();
          return newSnake;
        });
      }
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isRunning, speed, direction, food, colsRows, score]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    // clear
    ctx.fillStyle = "#0f172a"; // dark background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw grid (subtle)
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // draw food
    ctx.fillStyle = "#ef4444"; // red
    ctx.fillRect(food.x * gridSize + 2, food.y * gridSize + 2, gridSize - 4, gridSize - 4);

    // draw snake
    for (let i = 0; i < snake.length; i++) {
      const s = snake[i];
      const t = i === 0 ? 0.95 : 0.8 - (i / snake.length) * 0.5; // head brighter
      ctx.fillStyle = `rgba(34,197,94,${t})`; // green shades
      ctx.fillRect(s.x * gridSize + 1, s.y * gridSize + 1, gridSize - 2, gridSize - 2);
    }

    // if not running and snake collided (game over), show overlay
    if (!isRunning && snake.some((s, idx) => idx !== 0 && s.x === snake[0].x && s.y === snake[0].y)) {
      ctx.fillStyle = "rgba(2,6,23,0.6)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = `bold ${Math.max(16, gridSize)}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = `12px Arial`;
      ctx.fillText("Press Restart to play again", canvas.width / 2, canvas.height / 2 + 12);
    }
  }, [snake, food, isRunning, colsRows, gridSize]);

  // Start / Pause toggle
  function toggleRunning() {
    if (!isRunning) setIsRunning(true);
    else setIsRunning(false);
  }

  // Restart
  function handleRestart() {
    resetGame();
    setIsRunning(true);
  }

  // Increase difficulty
  function increaseSpeed() {
    setSpeed((s) => Math.min(20, s + 1));
  }
  function decreaseSpeed() {
    setSpeed((s) => Math.max(2, s - 1));
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 p-4 rounded-2xl shadow-lg"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-white text-xl font-semibold">Snake — React</h2>
            <p className="text-slate-400 text-sm">Use arrows or WASD. Swipe on touch. Space to pause.</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Score</div>
            <div className="text-white font-bold text-lg">{score}</div>
            <div className="text-xs text-slate-400">High: {highScore}</div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <canvas ref={canvasRef} className="w-full rounded-md block touch-pan-y" />
          </div>

          <div className="w-44 flex-shrink-0 flex flex-col gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
                <span>Speed</span>
                <span className="font-semibold">{speed}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={decreaseSpeed} className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600">-</button>
                <button onClick={increaseSpeed} className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600">+</button>
                <button onClick={() => setSpeed(8)} className="ml-auto px-2 py-1 rounded bg-slate-700">Reset</button>
              </div>
            </div>

            <div className="p-2 bg-slate-800 rounded-lg flex flex-col gap-2">
              <button onClick={toggleRunning} className="px-3 py-2 rounded-2xl bg-emerald-500 text-black font-semibold hover:shadow">
                {isRunning ? "Pause" : "Start"}
              </button>
              <button onClick={handleRestart} className="px-3 py-2 rounded-2xl bg-red-500 text-white font-semibold hover:shadow">
                Restart
              </button>
              <button
                onClick={() => {
                  setHighScore(0);
                  try {
                    localStorage.removeItem("snake_high_score");
                  } catch {}
                }}
                className="px-3 py-2 rounded-2xl bg-slate-700 text-white text-sm"
              >
                Reset High Score
              </button>
            </div>

            <div className="p-2 bg-slate-800 text-xs text-slate-300 rounded-lg">
              <strong>Controls</strong>
              <ul className="mt-2 list-disc list-inside">
                <li>Arrow keys / WASD</li>
                <li>Space to toggle pause</li>
                <li>Swipe on mobile</li>
                <li>Wrap-around edges</li>
              </ul>
            </div>

            <div className="text-xs text-slate-400">Tip: try increasing speed for a challenge.</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
