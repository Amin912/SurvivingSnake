// Trains a population outside the browser and saves the best brain, which
// the page loads so visitors can watch a trained snake straight away.
//
//   npm run train -- [generations] [seed]

import { writeFileSync } from "node:fs";

import { Layers, Population, playGame } from "../src/evolution.js";
import { seededRandom } from "../src/game.js";

const generations = Number(process.argv[2] ?? 300);
const seed = Number(process.argv[3] ?? 1);
const population = new Population({}, seededRandom(seed));

for (let g = 1; g <= generations; g++) {
  const stats = population.evaluate();
  if (g % 10 === 0) {
    console.log(`generation ${g}: best ${stats.bestScore}, average ${stats.averageScore.toFixed(1)}`);
  }
  if (g < generations) population.breed();
}

// The best snake of a generation may just have had lucky food. Replay the top
// candidates on fresh games and keep the one with the best average.
const testGames = 20;
const testRandom = seededRandom(seed + 1000);
const testSeeds = Array.from({ length: testGames }, () => Math.floor(testRandom() * 2 ** 32));
let chosen = null;
for (const { brain } of population.results.slice(0, 20)) {
  const scores = testSeeds.map((s) => playGame(brain, population.options.boardSize, seededRandom(s)).score);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (!chosen || average > chosen.average) chosen = { brain, average, best: Math.max(...scores) };
}

console.log(`chosen brain: average ${chosen.average.toFixed(1)}, best ${chosen.best} over ${testGames} new games`);
writeFileSync(
  new URL("../brains/trained.json", import.meta.url),
  JSON.stringify({
    generations,
    seed,
    averageScore: Number(chosen.average.toFixed(1)),
    layers: Layers,
    genes: Array.from(chosen.brain.genes),
  }) + "\n",
);
