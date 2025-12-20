import { parentPort, workerData } from 'worker_threads';

// Worker: perform `simulations` Monte Carlo runs and return trajectories array
// workerData: { simulations, days, params }

function randn_bm() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function sampleNormal(mean = 0, std = 1) {
  return mean + randn_bm() * std;
}

function sampleStudentT(nu = 3) {
  const normals = new Array(nu).fill(0).map(() => randn_bm());
  let chi2 = 0;
  for (let n of normals) chi2 += n * n;
  const t = normals[0] / Math.sqrt(chi2 / nu);
  return t;
}

function generateBaseline(days, type = 'linear', params = {}, historical = []) {
  const b = new Array(days).fill(0);
  if (type === 'linear') {
    const start = params.startValue ?? (historical[0] ?? 100);
    const end = params.endValue ?? (historical[historical.length - 1] ?? start * 1.2);
    const step = (end - start) / Math.max(1, days - 1);
    for (let i = 0; i < days; i++) b[i] = start + step * i;
  } else if (type === 'exponential') {
    const start = params.startValue ?? (historical[0] ?? 100);
    const growth = params.growth ?? 0.01;
    for (let i = 0; i < days; i++) b[i] = start * Math.pow(1 + growth, i);
  } else if (type === 'moving-average') {
    const avg = historical.length ? historical.reduce((s, v) => s + v, 0) / historical.length : (params.startValue ?? 100);
    for (let i = 0; i < days; i++) b[i] = avg;
  } else {
    for (let i = 0; i < days; i++) b[i] = 100;
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
  const { baselineType, noise = 'normal', noiseStd = 0.1, chaosIntensity = 0.5, chaosR = 3.9, historical = [] } = options;
  const base = generateBaseline(days, baselineType, options.baselineParams, historical);
  const sequences = logisticSequence(chaosR, days);
  const results = new Array(simulations);
  for (let s = 0; s < simulations; s++) {
    const traj = new Array(days);
    let x0 = Math.random();
    for (let t = 0; t < days; t++) {
      const b = base[t];
      const chaosFactor = 1 + chaosIntensity * (sequences[t] - 0.5) * 2;
      let noiseSample = 0;
      if (noise === 'student') noiseSample = sampleStudentT(options.nu ?? 3) * (noiseStd * b);
      else noiseSample = sampleNormal(0, noiseStd * b);
      const value = b + noiseSample * chaosFactor;
      traj[t] = Math.max(0, value);
    }
    results[s] = traj;
  }
  return results;
}

// Run and post back
const { simulations = 1000, days = 30, options = {} } = workerData || {};
const trajectories = runSimulations(simulations, days, options);
parentPort.postMessage({ trajectories });
