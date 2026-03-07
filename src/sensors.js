// What the snake can see. From its head it looks in eight directions and
// reports what each line of sight meets. These numbers are the inputs of
// its neural network.

// N, NE, E, SE, S, SW, W, NW as [dx, dy].
export const Directions = [
  [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1],
];

// Per direction: closeness of the wall, of its own body, and whether food
// lies that way. Then the direction it is heading and the direction its tail
// is moving, each as four on/off values.
export const InputCount = Directions.length * 3 + 4 + 4;

// Fills `rays` (if given) with what each ray hit, for drawing.
export function look(game, rays = null) {
  const input = new Float32Array(InputCount);
  const { x: headX, y: headY } = game.head;

  Directions.forEach(([dx, dy], d) => {
    let x = headX + dx;
    let y = headY + dy;
    let distance = 1;
    let body = 0;
    let food = 0;
    while (game.isInside(x, y)) {
      if (body === 0 && game.isBody(x, y)) body = distance;
      if (food === 0 && game.food && x === game.food.x && y === game.food.y) food = distance;
      x += dx;
      y += dy;
      distance++;
    }
    input[d * 3] = 1 / distance;
    input[d * 3 + 1] = body > 0 ? 1 / body : 0;
    input[d * 3 + 2] = food > 0 ? 1 : 0;
    if (rays) rays.push({ dx, dy, wall: distance, body, food });
  });

  input[Directions.length * 3 + game.direction] = 1;

  const tail = game.body[game.body.length - 1];
  const beforeTail = game.body[game.body.length - 2];
  input[Directions.length * 3 + 4 + directionBetween(tail, beforeTail)] = 1;
  return input;
}

// Direction (0 up, 1 right, 2 down, 3 left) of a step from `from` to `to`.
function directionBetween(from, to) {
  if (to.y < from.y) return 0;
  if (to.x > from.x) return 1;
  if (to.y > from.y) return 2;
  return 3;
}
