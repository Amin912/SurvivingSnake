// The rules of Snake, with no drawing code, so the same game runs on the
// page, in the training worker and in the tests.

export const Up = 0;
export const Right = 1;
export const Down = 2;
export const Left = 3;

// Movement for each direction, as [dx, dy].
export const Steps = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export class SnakeGame {
  // random:      function returning numbers in [0, 1), for placing food
  // starveAfter: moves allowed without eating before the snake dies
  constructor({ size = 20, random = Math.random, starveAfter = Infinity } = {}) {
    this.size = size;
    this.random = random;
    this.starveAfter = starveAfter;
    this.reset();
  }

  reset() {
    const middle = Math.floor(this.size / 2);
    this.cells = new Uint8Array(this.size * this.size); // 1 where the body is
    this.body = []; // head first
    for (let i = 0; i < 3; i++) {
      this.body.push({ x: middle - i, y: middle });
      this.cells[middle * this.size + middle - i] = 1;
    }
    this.direction = Right;
    this.alive = true;
    this.cause = null; // why the game ended: "wall", "self", "starved" or "won"
    this.score = 0;
    this.steps = 0;
    this.stepsSinceFood = 0;
    this.placeFood();
  }

  get head() {
    return this.body[0];
  }

  isInside(x, y) {
    return x >= 0 && y >= 0 && x < this.size && y < this.size;
  }

  isBody(x, y) {
    return this.cells[y * this.size + x] === 1;
  }

  placeFood() {
    const free = [];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (!this.isBody(x, y)) free.push({ x, y });
      }
    }
    this.food = free.length > 0 ? free[Math.floor(this.random() * free.length)] : null;
  }

  // Turning straight back into the body is ignored, as in the classic game.
  turn(direction) {
    if ((direction + 2) % 4 !== this.direction) this.direction = direction;
  }

  step() {
    if (!this.alive) return;
    const [dx, dy] = Steps[this.direction];
    const x = this.head.x + dx;
    const y = this.head.y + dy;

    if (!this.isInside(x, y)) return this.end("wall");
    const eats = this.food !== null && x === this.food.x && y === this.food.y;
    // The tail moves out of the way this step unless the snake grows.
    const tail = this.body[this.body.length - 1];
    const intoTail = x === tail.x && y === tail.y;
    if (this.isBody(x, y) && (eats || !intoTail)) return this.end("self");

    if (!eats) {
      this.body.pop();
      this.cells[tail.y * this.size + tail.x] = 0;
    }
    this.body.unshift({ x, y });
    this.cells[y * this.size + x] = 1;
    this.steps++;

    if (eats) {
      this.score++;
      this.stepsSinceFood = 0;
      this.placeFood();
      if (this.food === null) return this.end("won");
    } else if (++this.stepsSinceFood >= this.starveAfter) {
      this.end("starved");
    }
  }

  end(cause) {
    this.alive = false;
    this.cause = cause;
  }
}

// Small seeded random number generator (mulberry32), so a game can be
// replayed exactly and every snake in a generation gets the same food.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
