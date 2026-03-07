// Training by evolution: a population of snakes with random brains plays the
// game, the better players are more likely to become parents, and their
// children get a mix of both parents' weights with small random changes.

import { Brain } from "./brain.js";
import { SnakeGame, seededRandom } from "./game.js";
import { InputCount, look } from "./sensors.js";

export const Layers = [InputCount, 20, 12, 4];

export const Defaults = {
  populationSize: 400,
  boardSize: 20,
  eliteShare: 0.05, // the best 5% go to the next generation unchanged
  tournamentSize: 5,
  mutationRate: 0.05, // chance that a given weight changes
  mutationSize: 0.3, // standard deviation of that change
};

// Eating matters most, and more so the more it eats. Survival counts a little,
// which is what gets the first generations moving at all. Snakes cannot score
// by circling forever: they starve after 200 moves without food.
export function fitness(score, steps) {
  return steps + 1000 * score * score;
}

export const StarveAfter = 200;

export function playGame(brain, boardSize, random) {
  const game = new SnakeGame({ size: boardSize, random, starveAfter: StarveAfter });
  while (game.alive) {
    game.turn(brain.decide(look(game)));
    game.step();
  }
  return game;
}

export class Population {
  constructor(options = {}, random = Math.random) {
    this.options = { ...Defaults, ...options };
    this.random = random;
    this.generation = 1;
    this.brains = Array.from({ length: this.options.populationSize }, () => Brain.random(Layers, random));
    this.results = null;
  }

  // Plays one game per snake. Every snake in a generation gets the same food
  // sequence, so they are compared fairly. Returns the generation's stats.
  evaluate() {
    const seed = Math.floor(this.random() * 2 ** 32);
    this.results = this.brains.map((brain) => {
      const game = playGame(brain, this.options.boardSize, seededRandom(seed));
      return { brain, score: game.score, steps: game.steps, fitness: fitness(game.score, game.steps) };
    });
    this.results.sort((a, b) => b.fitness - a.fitness);

    const scores = this.results.map((r) => r.score);
    return {
      generation: this.generation,
      bestScore: Math.max(...scores),
      averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      best: this.results[0].brain,
    };
  }

  // Builds the next generation from the results of evaluate().
  breed() {
    const { populationSize, eliteShare } = this.options;
    const eliteCount = Math.max(1, Math.round(populationSize * eliteShare));
    const next = this.results.slice(0, eliteCount).map((r) => r.brain);
    while (next.length < populationSize) {
      next.push(this.child(this.pickParent(), this.pickParent()));
    }
    this.brains = next;
    this.generation++;
  }

  // Tournament selection: the fittest of a few random snakes.
  pickParent() {
    let best = null;
    for (let i = 0; i < this.options.tournamentSize; i++) {
      const candidate = this.results[Math.floor(this.random() * this.results.length)];
      if (!best || candidate.fitness > best.fitness) best = candidate;
    }
    return best.brain;
  }

  // Each weight comes from one parent or the other, then may be nudged.
  child(mother, father) {
    const { mutationRate, mutationSize } = this.options;
    const genes = new Float32Array(mother.genes.length);
    for (let i = 0; i < genes.length; i++) {
      genes[i] = this.random() < 0.5 ? mother.genes[i] : father.genes[i];
      if (this.random() < mutationRate) genes[i] += gaussian(this.random) * mutationSize;
    }
    return new Brain(Layers, genes);
  }
}

// Normally distributed number (Box-Muller).
function gaussian(random) {
  const u = 1 - random();
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
