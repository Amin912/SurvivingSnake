import { test } from "node:test";
import assert from "node:assert/strict";

import { Brain } from "../src/brain.js";
import { Layers, Population, fitness } from "../src/evolution.js";
import { SnakeGame, seededRandom } from "../src/game.js";
import { InputCount, look } from "../src/sensors.js";

test("gene count covers every weight and bias", () => {
  assert.equal(Brain.geneCount([2, 3, 1]), 2 * 3 + 3 + 3 * 1 + 1);
  assert.equal(Brain.random(Layers).genes.length, Brain.geneCount(Layers));
});

test("the network computes a known result", () => {
  // Two inputs -> two hidden neurons (ReLU) -> one output.
  const genes = new Float32Array([
    1, 1, // hidden 1 = x + y
    1, -1, // hidden 2 = x - y
    0, 0, // hidden biases
    2, 3, // output = 2 * h1 + 3 * h2
    0.5, // output bias
  ]);
  const brain = new Brain([2, 2, 1], genes);
  // x=1, y=2: h1 = 3, h2 = relu(-1) = 0, output = 6 + 0.5
  assert.equal(brain.think([1, 2])[0], 6.5);
});

test("decide picks the strongest output", () => {
  const genes = new Float32Array(Brain.geneCount([1, 4]));
  genes[4 + 2] = 1; // bias of output 2
  assert.equal(new Brain([1, 4], genes).decide([0]), 2);
});

test("sensors see the walls, the body behind and the food", () => {
  const game = new SnakeGame({ size: 10 });
  game.food = { x: 8, y: 5 }; // straight ahead (east)
  const rays = [];
  const input = look(game, rays);
  assert.equal(input.length, InputCount);

  const east = 2;
  const west = 6;
  assert.equal(rays[east].food, 3);
  assert.equal(input[east * 3 + 2], 1);
  assert.equal(rays[west].body, 1, "the neck is right behind the head");
  assert.equal(input[west * 3 + 1], 1);
  assert.equal(rays[east].wall, 5, "the head is at x=5 on a 10-wide board");
  assert.equal(input[24 + 1], 1, "heading right");
  assert.equal(input[28 + 1], 1, "tail moving right");
});

test("eating is worth more than surviving", () => {
  assert.ok(fitness(1, 10) > fitness(0, 199));
  assert.ok(fitness(5, 100) > fitness(4, 400));
});

test("a new generation keeps its size and its best snakes", () => {
  const population = new Population({ populationSize: 40 }, seededRandom(3));
  population.evaluate();
  const best = population.results[0].brain;
  population.breed();
  assert.equal(population.brains.length, 40);
  assert.equal(population.generation, 2);
  assert.ok(population.brains.includes(best));
});

test("without mutation, a child's genes all come from its parents", () => {
  const population = new Population({ populationSize: 10, mutationRate: 0 }, seededRandom(5));
  const [mother, father] = population.brains;
  const child = population.child(mother, father);
  child.genes.forEach((gene, i) => {
    assert.ok(gene === mother.genes[i] || gene === father.genes[i]);
  });
});

test("training with the same seed gives the same result", () => {
  const run = () => {
    const population = new Population({ populationSize: 30 }, seededRandom(11));
    for (let g = 0; g < 3; g++) {
      population.evaluate();
      population.breed();
    }
    return population.evaluate();
  };
  const a = run();
  const b = run();
  assert.equal(a.bestScore, b.bestScore);
  assert.deepEqual(a.best.genes, b.best.genes);
});
