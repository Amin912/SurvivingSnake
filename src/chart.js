// Line chart of the best and average score per generation.

const Best = "#5eead4";
const Average = "#ff6b6b";
const Axis = "rgba(255, 255, 255, 0.12)";
const Label = "#8b93ad";

export function drawChart(ctx, history, width, height) {
  ctx.clearRect(0, 0, width, height);
  const left = 34;
  const right = 8;
  const top = 10;
  const bottom = 22;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const maxScore = Math.max(5, ...history.map((h) => h.bestScore));
  const maxGeneration = Math.max(10, history.length);
  const x = (i) => left + (i / Math.max(maxGeneration - 1, 1)) * plotWidth;
  const y = (score) => top + plotHeight - (score / maxScore) * plotHeight;

  ctx.font = "11px system-ui, sans-serif";
  ctx.fillStyle = Label;
  ctx.strokeStyle = Axis;
  ctx.lineWidth = 1;
  ctx.textAlign = "right";
  for (const value of [0, Math.round(maxScore / 2), maxScore]) {
    ctx.beginPath();
    ctx.moveTo(left, Math.round(y(value)) + 0.5);
    ctx.lineTo(width - right, Math.round(y(value)) + 0.5);
    ctx.stroke();
    ctx.fillText(value, left - 6, y(value) + 4);
  }
  ctx.textAlign = "center";
  ctx.fillText("generation", left + plotWidth / 2, height - 5);

  if (history.length === 0) {
    ctx.fillText("Start training to see progress", left + plotWidth / 2, top + plotHeight / 2);
    return;
  }

  const line = (key, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((h, i) => (i === 0 ? ctx.moveTo(x(i), y(h[key])) : ctx.lineTo(x(i), y(h[key]))));
    ctx.stroke();
  };
  line("averageScore", Average);
  line("bestScore", Best);
}

export const ChartColors = { Best, Average };
