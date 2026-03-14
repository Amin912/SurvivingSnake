// Drawing the board on a canvas. Kept apart from the rules so the training
// worker never touches the DOM.

export const Colors = {
  board: "#141a2e",
  grid: "rgba(255, 255, 255, 0.035)",
  head: "#5eead4",
  body: [45, 212, 191], // fades towards the tail
  food: "#ff6b6b",
  text: "#eef1f8",
  muted: "#8b93ad",
};

// Makes the canvas sharp on high-DPI screens and returns a context that
// draws in a fixed width x height coordinate space. CSS may still shrink the
// canvas on a narrow screen; the drawing scales with it.
export function setUpCanvas(canvas, width, height) {
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.maxWidth = `${width}px`;
  canvas.style.aspectRatio = `${width} / ${height}`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

// The snake's eight lines of sight, as returned by look(). Faint to the wall,
// coral where it sees food, white where it sees its own body.
export function drawRays(ctx, game, rays, cell) {
  const cx = (game.head.x + 0.5) * cell;
  const cy = (game.head.y + 0.5) * cell;
  const segment = (dx, dy, distance, color, width) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dx * (distance - 0.5) * cell, cy + dy * (distance - 0.5) * cell);
    ctx.stroke();
  };
  for (const ray of rays) {
    segment(ray.dx, ray.dy, ray.wall, "rgba(255, 255, 255, 0.07)", 1);
    if (ray.body) segment(ray.dx, ray.dy, ray.body, "rgba(255, 255, 255, 0.28)", 1.5);
    if (ray.food) segment(ray.dx, ray.dy, ray.food, "rgba(255, 107, 107, 0.7)", 2);
  }
}

export function drawBoard(ctx, game, cell) {
  const size = game.size * cell;
  ctx.fillStyle = Colors.board;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = Colors.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < game.size; i++) {
    ctx.moveTo(i * cell + 0.5, 0);
    ctx.lineTo(i * cell + 0.5, size);
    ctx.moveTo(0, i * cell + 0.5);
    ctx.lineTo(size, i * cell + 0.5);
  }
  ctx.stroke();

  if (game.food) {
    const x = (game.food.x + 0.5) * cell;
    const y = (game.food.y + 0.5) * cell;
    ctx.shadowColor = Colors.food;
    ctx.shadowBlur = cell * 0.6;
    ctx.fillStyle = Colors.food;
    ctx.beginPath();
    ctx.arc(x, y, cell * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  const [r, g, b] = Colors.body;
  const last = Math.max(game.body.length - 1, 1);
  game.body.forEach((part, i) => {
    const fade = 1 - 0.55 * (i / last);
    ctx.fillStyle = i === 0 ? Colors.head : `rgba(${r}, ${g}, ${b}, ${fade})`;
    const inset = i === 0 ? 1.5 : 2.5;
    roundRect(ctx, part.x * cell + inset, part.y * cell + inset, cell - 2 * inset, cell - 2 * inset, cell * 0.28);
    ctx.fill();
  });
}

export function drawMessage(ctx, game, cell, title, subtitle) {
  const size = game.size * cell;
  ctx.fillStyle = "rgba(10, 13, 25, 0.72)";
  ctx.fillRect(0, 0, size, size);
  ctx.textAlign = "center";
  ctx.fillStyle = Colors.text;
  ctx.font = "600 28px system-ui, sans-serif";
  ctx.fillText(title, size / 2, size / 2 - 8);
  ctx.fillStyle = Colors.muted;
  ctx.font = "15px system-ui, sans-serif";
  ctx.fillText(subtitle, size / 2, size / 2 + 22);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
