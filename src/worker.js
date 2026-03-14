// Runs the evolution off the main thread, so the page stays smooth while a
// generation is being played (up to a second or two once snakes get good).

import { Population } from "./evolution.js";

let population = null;
let running = false;
let timer = null;

function runGeneration() {
  if (!running) return;
  const stats = population.evaluate();
  postMessage({
    type: "generation",
    generation: stats.generation,
    bestScore: stats.bestScore,
    averageScore: stats.averageScore,
    genes: stats.best.genes, // copied, not transferred: the brain lives on
  });
  population.breed();
  // Yield between generations so pause and reset messages get through.
  timer = setTimeout(runGeneration, 0);
}

self.onmessage = ({ data }) => {
  if (data.type === "start") {
    population ??= new Population();
    if (!running) {
      running = true;
      runGeneration();
    }
  } else if (data.type === "pause") {
    running = false;
    clearTimeout(timer);
  } else if (data.type === "reset") {
    clearTimeout(timer);
    population = new Population();
    running = true;
    runGeneration();
  }
};
