import { parentPort, workerData } from 'worker_threads';

/**
 * Perform stochastic simulations using a hybrid baseline + chaos model.
 */

function sampleNormal(mean = 0, std = 1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * std;
}

/**
 * Generates a refined baseline based on historical trends or defaults.
 */
function generateBaseline(days, type, params, historical) {
  const b = new Array(days).fill(0);
  const start = params.startValue || 1000;

  if (type === 'linear') {
    const growth = params.growth || 0.05; // 5% growth by default
    const end = start * (1 + growth);
    const step = (end - start) / Math.max(1, days - 1);
    for (let i = 0; i < days; i++) b[i] = start + step * i;
  } else if (type === 'exponential') {
    const rate = params.growthRate || 0.002; // Daily compounded growth
    for (let i = 0; i < days; i++) b[i] = start * Math.pow(1 + rate, i);
  } else {
    // Static Mean Baseline
    for (let i = 0; i < days; i++) b[i] = start;
  }
  return b;
}

function logisticSequence(r, length, x0 = Math.random()) {
  const arr = new Array(length);
  let x = x0;
  for (let i = 0; i < length; i++) {
    x = r * x * (1 - x);
    arr[i] = x;
  }
  return arr;
}

function runSimulations(simulations, days, options) {
  const {
    baselineType = 'linear',
    chaosIntensity = 0.5,
    historical = [],
    baselineParams = {}
  } = options;

  const base = generateBaseline(days, baselineType, baselineParams, historical);
  const sequences = logisticSequence(3.9, days);
  const noiseStd = 0.15; // 15% volatility bound

  const results = new Array(simulations);
  for (let s = 0; s < simulations; s++) {
    const traj = new Array(days);
    for (let t = 0; t < days; t++) {
      const b = base[t];

      // Stochastic Multipliers
      const chaosFactor = 1 + chaosIntensity * (sequences[t] - 0.5) * 2;
      const noiseSample = sampleNormal(0, noiseStd * b);

      const value = b + noiseSample * chaosFactor;
      traj[t] = Math.max(0, value);
    }
    results[s] = traj;
  }
  return results;
}

// Execution Entry
const { simulations = 1000, days = 30, options = {} } = workerData || {};
const trajectories = runSimulations(simulations, days, options);
parentPort.postMessage({ trajectories });
