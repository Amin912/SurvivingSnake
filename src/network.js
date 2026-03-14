// Draws the neural network as it decides: neurons glow with their activation,
// and the strongest connections are shown, teal for positive weights and
// coral for negative ones.

const Positive = [94, 234, 212];
const Negative = [255, 107, 107];
const Arrows = ["↑", "→", "↓", "←"];

export function drawNetwork(ctx, brain, width, height, chosen) {
  ctx.clearRect(0, 0, width, height);
  if (!brain) return;

  const { layers, genes, activations } = brain;
  const marginX = 16;
  const marginRight = 30; // room for the output arrows
  const columns = layers.map((count, l) => {
    const x = marginX + (l / (layers.length - 1)) * (width - marginX - marginRight);
    const spacing = Math.min(16, (height - 16) / count);
    const startY = height / 2 - ((count - 1) * spacing) / 2;
    return Array.from({ length: count }, (_, i) => ({ x, y: startY + i * spacing }));
  });

  // Connections: only the strongest, or the picture turns into a grey blur.
  let offset = 0;
  for (let l = 1; l < layers.length; l++) {
    const inCount = layers[l - 1];
    const outCount = layers[l];
    for (let j = 0; j < outCount; j++) {
      for (let i = 0; i < inCount; i++) {
        const weight = genes[offset + j * inCount + i];
        const strength = Math.min(Math.abs(weight), 2) / 2;
        if (strength < 0.45) continue;
        const [r, g, b] = weight > 0 ? Positive : Negative;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.06 + 0.3 * (strength - 0.45)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(columns[l - 1][i].x, columns[l - 1][i].y);
        ctx.lineTo(columns[l][j].x, columns[l][j].y);
        ctx.stroke();
      }
    }
    offset += (inCount + 1) * outCount;
  }

  // Neurons, brighter when more active.
  columns.forEach((column, l) => {
    const values = activations[l];
    const max = Math.max(1e-6, ...Array.from(values, Math.abs));
    column.forEach(({ x, y }, i) => {
      const level = l === layers.length - 1 ? (i === chosen ? 1 : 0.15) : Math.abs(values[i]) / max;
      ctx.fillStyle = `rgba(94, 234, 212, ${0.12 + 0.88 * level})`;
      ctx.beginPath();
      ctx.arc(x, y, l === layers.length - 1 ? 6 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  ctx.font = "600 13px system-ui, sans-serif";
  ctx.textAlign = "left";
  columns[columns.length - 1].forEach(({ x, y }, i) => {
    ctx.fillStyle = i === chosen ? "#eef1f8" : "#5b6280";
    ctx.fillText(Arrows[i], x + 12, y + 4);
  });
}
