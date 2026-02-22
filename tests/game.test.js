import { test } from "node:test";
import assert from "node:assert/strict";

import { Down, Left, Right, SnakeGame, Up, seededRandom } from "../src/game.js";

test("starts in the middle with three segments heading right", () => {
  const game = new SnakeGame({ size: 10 });
  assert.deepEqual(game.body, [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }]);
  assert.equal(game.direction, Right);
  assert.ok(game.food);
  assert.ok(!game.isBody(game.food.x, game.food.y));
});

test("moves one cell per step and keeps its length", () => {
  const game = new SnakeGame({ size: 10 });
  game.food = { x: 0, y: 0 };
  game.step();
  assert.deepEqual(game.head, { x: 6, y: 5 });
  assert.equal(game.body.length, 3);
  assert.ok(!game.isBody(3, 5), "the old tail cell is free again");
});

test("ignores a turn straight back into itself", () => {
  const game = new SnakeGame({ size: 10 });
  game.turn(Left);
  assert.equal(game.direction, Right);
  game.turn(Up);
  assert.equal(game.direction, Up);
});

test("grows and scores when it eats", () => {
  const game = new SnakeGame({ size: 10 });
  game.food = { x: 6, y: 5 };
  game.step();
  assert.equal(game.score, 1);
  assert.equal(game.body.length, 4);
  assert.ok(game.food && !(game.food.x === 6 && game.food.y === 5));
});

test("dies when it leaves the board", () => {
  const game = new SnakeGame({ size: 10 });
  game.food = { x: 0, y: 0 };
  for (let i = 0; i < 4; i++) game.step();
  assert.ok(game.alive);
  game.step();
  assert.equal(game.alive, false);
  assert.equal(game.cause, "wall");
});

test("dies when it runs into its body", () => {
  const game = new SnakeGame({ size: 10 });
  game.body = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }];
  game.cells.fill(0);
  for (const p of game.body) game.cells[p.y * 10 + p.x] = 1;
  game.food = { x: 0, y: 0 };
  game.turn(Down);
  game.step();
  assert.equal(game.cause, "self");
});

test("may move into the cell its tail is leaving", () => {
  const game = new SnakeGame({ size: 10 });
  // A 2x2 loop: the head follows the tail around.
  game.body = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 4, y: 6 }, { x: 4, y: 5 }];
  game.cells.fill(0);
  for (const p of game.body) game.cells[p.y * 10 + p.x] = 1;
  game.food = { x: 0, y: 0 };
  game.direction = Up;
  game.turn(Left);
  game.step();
  assert.ok(game.alive);
  assert.deepEqual(game.head, { x: 4, y: 5 });
});

test("starves after too many moves without food", () => {
  const game = new SnakeGame({ size: 10, starveAfter: 3 });
  game.food = { x: 0, y: 0 };
  game.step();
  game.step();
  assert.ok(game.alive);
  game.step();
  assert.equal(game.cause, "starved");
});

test("the seeded generator repeats exactly", () => {
  const a = seededRandom(42);
  const b = seededRandom(42);
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
  const values = Array.from({ length: 1000 }, seededRandom(7));
  assert.ok(values.every((v) => v >= 0 && v < 1));
});
