import { Brain } from "./brain.js";
import { drawChart } from "./chart.js";
import { drawBoard, drawMessage, drawRays, setUpCanvas } from "./draw.js";
import { Layers, StarveAfter } from "./evolution.js";
import { Down, Left, Right, SnakeGame, Up } from "./game.js";
import { drawNetwork } from "./network.js";
import { look } from "./sensors.js";

const Cell = 24;
const BoardSize = 20;
const PlaySpeed = 9; // moves per second when you play
const [ChartWidth, ChartHeight] = [460, 180];
const [NetworkWidth, NetworkHeight] = [460, 280];
const Keys = {
  ArrowUp: Up, KeyW: Up,
  ArrowRight: Right, KeyD: Right,
  ArrowDown: Down, KeyS: Down,
  ArrowLeft: Left, KeyA: Left,
};

const $ = (id) => document.getElementById(id);
const boardCtx = setUpCanvas($("board"), BoardSize * Cell, BoardSize * Cell);
const chartCtx = setUpCanvas($("chart"), ChartWidth, ChartHeight);
const networkCtx = setUpCanvas($("network"), NetworkWidth, NetworkHeight);

const state = {
  mode: "watch", // "watch" the AI or "play" yourself
  source: "trained", // which brain is watched: "trained" or the "live" best of training
  trained: null, // { brain, label }
  live: null, // { brain, label }
  training: "idle", // "idle", "running" or "paused"
  history: [],
  game: new SnakeGame({ size: BoardSize, starveAfter: StarveAfter }),
  brain: null, // the brain driving the current game
  rays: [],
  choice: null, // the output the network picked last
  started: false, // play mode: has the player pressed a key yet
  turns: [], // play mode: key presses waiting for the next move
  restartAt: 0, // watch mode: when to start the next game after one ends
};

// ----- Training worker -------------------------------------------------------

const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
worker.onmessage = ({ data }) => {
  if (data.type !== "generation") return;
  state.history.push(data);
  state.live = {
    brain: new Brain(Layers, data.genes),
    label: `Generation ${data.generation}`,
  };
  $("generation").textContent = data.generation;
  $("best").textContent = Math.max(...state.history.map((h) => h.bestScore));
  $("average").textContent = data.averageScore.toFixed(1);
  drawChart(chartCtx, state.history, ChartWidth, ChartHeight);
};

function setTraining(next) {
  state.training = next;
  if (next === "running") worker.postMessage({ type: "start" });
  if (next === "paused") worker.postMessage({ type: "pause" });
  $("train").textContent = next === "running" ? "Pause training" : next === "paused" ? "Resume training" : "Start training";
  $("reset").disabled = next === "idle";
}

$("train").onclick = () => {
  if (state.training === "running") {
    setTraining("paused");
  } else {
    setTraining("running");
    chooseSource("live");
  }
};

$("reset").onclick = () => {
  state.history = [];
  state.live = null;
  worker.postMessage({ type: "reset" });
  setTraining("running");
  for (const id of ["generation", "best", "average"]) $(id).textContent = "–";
  drawChart(chartCtx, state.history, ChartWidth, ChartHeight);
};

// ----- Modes and sources -----------------------------------------------------

function chooseMode(mode) {
  state.mode = mode;
  for (const button of document.querySelectorAll("[data-mode]")) {
    button.classList.toggle("active", button.dataset.mode === mode);
  }
  document.body.classList.toggle("playing", mode === "play");
  newGame();
}

function chooseSource(source) {
  state.source = source;
  for (const button of document.querySelectorAll("[data-source]")) {
    button.classList.toggle("active", button.dataset.source === source);
  }
  if (state.mode === "watch") newGame();
}

for (const button of document.querySelectorAll("[data-mode]")) {
  button.onclick = () => chooseMode(button.dataset.mode);
}
for (const button of document.querySelectorAll("[data-source]")) {
  button.onclick = () => chooseSource(button.dataset.source);
}

function watchedBrain() {
  return state.source === "live" && state.live ? state.live : state.trained;
}

function newGame() {
  const starve = state.mode === "watch" ? StarveAfter : Infinity;
  state.game = new SnakeGame({ size: BoardSize, starveAfter: starve });
  state.brain = state.mode === "watch" ? watchedBrain()?.brain ?? null : null;
  state.started = false;
  state.turns.length = 0;
  state.rays = [];
  state.choice = null;
  state.restartAt = 0;
  if (state.brain) state.rays = sense();
}

// ----- Playing ---------------------------------------------------------------

document.addEventListener("keydown", (event) => {
  if (state.mode !== "play") return;
  if (event.code in Keys) {
    event.preventDefault();
    if (state.turns.length < 3) state.turns.push(Keys[event.code]);
    state.started = true;
  } else if ((event.code === "Space" || event.code === "Enter") && !state.game.alive) {
    event.preventDefault();
    newGame();
  }
});

function sense() {
  const rays = [];
  const input = look(state.game, rays);
  state.choice = state.brain.decide(input);
  return rays;
}

function tick(now) {
  const game = state.game;
  if (state.mode === "play") {
    if (state.started && game.alive) {
      if (state.turns.length > 0) game.turn(state.turns.shift());
      game.step();
    }
    return;
  }
  if (!state.brain) return;
  if (game.alive) {
    game.turn(state.choice);
    game.step();
    if (game.alive) state.rays = sense();
    else state.restartAt = now + 1200;
  } else if (now >= state.restartAt) {
    newGame();
  }
}

// ----- Drawing ---------------------------------------------------------------

function render() {
  const game = state.game;
  drawBoard(boardCtx, game, Cell);
  $("score").textContent = game.score;

  if (state.mode === "play") {
    if (!state.started) drawMessage(boardCtx, game, Cell, "Your turn", "Press an arrow key to start");
    else if (!game.alive) drawMessage(boardCtx, game, Cell, `Score ${game.score}`, "Press Space to play again");
    return;
  }

  if (!state.brain) {
    drawMessage(boardCtx, game, Cell, "Loading…", "");
  } else if (game.alive) {
    drawRays(boardCtx, game, state.rays, Cell);
  } else {
    const reason = { wall: "hit a wall", self: "ran into itself", starved: "starved", won: "filled the board" }[game.cause];
    drawMessage(boardCtx, game, Cell, `Score ${game.score}`, `It ${reason}. Next game starting…`);
  }
  $("brain-label").textContent = watchedBrain()?.label ?? "";
  drawNetwork(networkCtx, state.brain, NetworkWidth, NetworkHeight, state.choice);
}

// ----- Main loop -------------------------------------------------------------

let last = performance.now();
let pending = 0;
function frame(now) {
  const speed = state.mode === "play" ? PlaySpeed : Number($("speed").value);
  pending += (now - last) / 1000;
  last = now;
  const interval = 1 / speed;
  // Catch up a few moves at most if the tab was in the background.
  for (let i = 0; i < 4 && pending >= interval; i++) {
    pending -= interval;
    tick(now);
  }
  pending = Math.min(pending, interval);
  render();
  requestAnimationFrame(frame);
}

fetch(new URL("../brains/trained.json", import.meta.url))
  .then((response) => response.json())
  .then((saved) => {
    state.trained = {
      brain: new Brain(saved.layers, Float32Array.from(saved.genes)),
      label: `Trained for ${saved.generations} generations, averages ${Math.round(saved.averageScore)} apples`,
    };
    if (state.mode === "watch" && !state.brain) newGame();
  });

setTraining("idle");
drawChart(chartCtx, state.history, ChartWidth, ChartHeight);
requestAnimationFrame(frame);
