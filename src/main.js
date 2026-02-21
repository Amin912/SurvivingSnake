import { Down, Left, Right, SnakeGame, Up } from "./game.js";
import { drawBoard, drawMessage, setUpCanvas } from "./draw.js";

const Cell = 24;
const TickMs = 110;
const Keys = {
  ArrowUp: Up, KeyW: Up,
  ArrowRight: Right, KeyD: Right,
  ArrowDown: Down, KeyS: Down,
  ArrowLeft: Left, KeyA: Left,
};

const game = new SnakeGame({ size: 20 });
const canvas = document.getElementById("board");
const ctx = setUpCanvas(canvas, game.size * Cell, game.size * Cell);
const scoreLabel = document.getElementById("score");

let started = false;
// Key presses between two ticks are queued, so a quick "up, left" is not
// lost when both arrive in the same tick.
const turns = [];

document.addEventListener("keydown", (event) => {
  if (event.code in Keys) {
    event.preventDefault();
    if (turns.length < 3) turns.push(Keys[event.code]);
    started = true;
  } else if ((event.code === "Space" || event.code === "Enter") && !game.alive) {
    game.reset();
    turns.length = 0;
  }
});

function tick() {
  if (started && game.alive) {
    if (turns.length > 0) game.turn(turns.shift());
    game.step();
  }
  render();
}

function render() {
  drawBoard(ctx, game, Cell);
  scoreLabel.textContent = game.score;
  if (!started) {
    drawMessage(ctx, game, Cell, "Snake", "Press an arrow key to start");
  } else if (!game.alive) {
    drawMessage(ctx, game, Cell, `Score ${game.score}`, "Press Space to play again");
  }
}

render();
setInterval(tick, TickMs);
