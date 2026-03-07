// A small fully connected neural network. Its weights are stored in one flat
// array (the "genome"), which is what the genetic algorithm copies, mixes
// and mutates.

export class Brain {
  // layers: neurons per layer, inputs first, e.g. [32, 20, 12, 4]
  constructor(layers, genes = new Float32Array(Brain.geneCount(layers))) {
    if (genes.length !== Brain.geneCount(layers)) {
      throw new Error(`expected ${Brain.geneCount(layers)} genes, got ${genes.length}`);
    }
    this.layers = layers;
    this.genes = genes;
    // Kept between calls so a game step allocates nothing, and so the page
    // can show which neurons are active.
    this.activations = layers.map((n) => new Float32Array(n));
  }

  // Each layer has a weight per input per neuron, plus a bias per neuron.
  static geneCount(layers) {
    let count = 0;
    for (let l = 1; l < layers.length; l++) count += (layers[l - 1] + 1) * layers[l];
    return count;
  }

  static random(layers, random = Math.random) {
    const genes = new Float32Array(Brain.geneCount(layers));
    for (let i = 0; i < genes.length; i++) genes[i] = random() * 2 - 1;
    return new Brain(layers, genes);
  }

  think(input) {
    this.activations[0].set(input);
    let offset = 0;
    for (let l = 1; l < this.layers.length; l++) {
      const inputs = this.activations[l - 1];
      const outputs = this.activations[l];
      const inCount = this.layers[l - 1];
      const outCount = this.layers[l];
      const biases = offset + inCount * outCount;
      const hidden = l < this.layers.length - 1;
      for (let j = 0; j < outCount; j++) {
        let sum = this.genes[biases + j];
        const row = offset + j * inCount;
        for (let i = 0; i < inCount; i++) sum += this.genes[row + i] * inputs[i];
        outputs[j] = hidden ? Math.max(0, sum) : sum; // ReLU on hidden layers
      }
      offset = biases + outCount;
    }
    return this.activations[this.activations.length - 1];
  }

  // Index of the strongest output: the direction to turn.
  decide(input) {
    const output = this.think(input);
    let best = 0;
    for (let i = 1; i < output.length; i++) if (output[i] > output[best]) best = i;
    return best;
  }
}
