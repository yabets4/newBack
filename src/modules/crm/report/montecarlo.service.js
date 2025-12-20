import os from 'os';
import path from 'path';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { insertForecast } from './salesForecast.model.js';
import pool from '../../../loaders/db.loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
}

function aggregateTrajectories(allTrajs, days) {
  const sims = allTrajs.length;
  const mean = new Array(days).fill(0);
  const min = new Array(days).fill(Number.POSITIVE_INFINITY);
  const max = new Array(days).fill(Number.NEGATIVE_INFINITY);
  const p5 = new Array(days).fill(0);
  const p95 = new Array(days).fill(0);

  for (let t = 0; t < days; t++) {
    const vals = new Array(sims);
    for (let s = 0; s < sims; s++) vals[s] = allTrajs[s][t];
    vals.sort((a, b) => a - b);
    const ssum = vals.reduce((a, b) => a + b, 0);
    mean[t] = ssum / sims;
    min[t] = vals[0];
    max[t] = vals[vals.length - 1];
    p5[t] = percentile(vals, 5);
    p95[t] = percentile(vals, 95);
  }
  return { mean, min, max, p5, p95 };
}

export async function runForecast(params = {}) {
  // params: startDate, endDate, baselineModelType, chaosIntensity, simulationCount, seasonalityConfig, historicalDataSource, target
  const startDate = params.startDate ? new Date(params.startDate) : new Date();
  const endDate = params.endDate ? new Date(params.endDate) : new Date(startDate.getTime() + 29 * 86400000);
  const days = Math.max(1, Math.ceil((endDate - startDate) / 86400000) + 1);
  const simulations = Math.max(1, params.simulationCount || 1000);
  const baselineType = params.baselineModelType || 'linear';
  const chaosIntensity = typeof params.chaosIntensity === 'number' ? params.chaosIntensity : 0.5;
  const chaosR = params.chaosR || 3.9;
  const noise = params.noise || 'normal';
  const noiseStd = params.noiseStd ?? 0.1;
  const chunkSize = Math.min(simulations, params.chunkSize || 100000);

  // If the caller didn't provide historical data, try to load recent daily revenue
  // from the `orders` table for the company (supports company_id or companyId)
  let historical = params.historicalDataSource || params.historical || [];
  const companyId = params.companyId || params.company_id || params.company;
  if ((!historical || !historical.length) && companyId) {
    try {
      // allow caller to pick which date field to aggregate by
      const allowed = { order_date: 'order_date', created_at: 'created_at', delivery_date: 'delivery_date' };
      const dateField = allowed[params.dateField] || 'order_date';
      console.log(`[montecarlo] loading historicals for company=${companyId} using dateField=${dateField} between ${startDate.toISOString().slice(0,10)} and ${endDate.toISOString().slice(0,10)}`);
      const q = `SELECT ${dateField}::date as d, COALESCE(SUM(total_amount),0) as total
                 FROM orders
                 WHERE company_id = $1 AND ${dateField}::date BETWEEN $2 AND $3
                 GROUP BY d ORDER BY d`;
      const startD = startDate.toISOString().slice(0,10);
      const endD = endDate.toISOString().slice(0,10);
      const { rows } = await pool.query(q, [companyId, startD, endD]);
      // Build an array of daily totals aligned to [startDate .. endDate]
      const map = rows.reduce((acc, r) => { const key = (new Date(r.d)).toISOString().slice(0,10); acc[key] = parseFloat(r.total || 0); return acc; }, {});
      const arr = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(startDate.getTime() + i * 86400000);
        const key = d.toISOString().slice(0,10);
        arr.push(map[key] || 0);
      }
      historical = arr;
      // capture debug rows sample for caller if requested
      var debugRowsSample = rows.slice(0, 5).map(r => ({ date: (new Date(r.d)).toISOString().slice(0,10), total: parseFloat(r.total || 0) }));
      var debugRowsCount = rows.length;
      console.log(`[montecarlo] loaded historical array length=${historical.length} sample=${historical.slice(0,5).map(v => Math.round(v))}`);
    } catch (err) {
      console.error('Failed to load historical orders for company:', err);
      historical = [];
    }
  }

  const workerUrl = new URL('./montecarlo.worker.js', import.meta.url);

  // build worker tasks
  const tasks = [];
  let remaining = simulations;
  while (remaining > 0) {
    const take = Math.min(remaining, chunkSize);
    tasks.push(take);
    remaining -= take;
  }

  const resultsTrajs = [];

  console.log(`[montecarlo] starting ${simulations} simulations in ${tasks.length} worker(s) (chunkSize=${chunkSize})`);
  await Promise.all(tasks.map((taskSim) => new Promise((resolve, reject) => {
    const worker = new Worker(workerUrl, { type: 'module', workerData: { simulations: taskSim, days, options: { baselineType, noise, noiseStd, chaosIntensity, chaosR, baselineParams: params.baselineParams || {}, historical } } });
    worker.on('message', (msg) => {
      if (msg.trajectories) {
        for (const t of msg.trajectories) resultsTrajs.push(t);
      }
    });
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      else resolve();
    });
  })));
  console.log(`[montecarlo] workers complete — collected ${resultsTrajs.length} trajectories`);

  // aggregate
  const agg = aggregateTrajectories(resultsTrajs, days);

  // compute volatility index and probability of hitting target (if provided)
  const finalVals = resultsTrajs.map((r) => r[r.length - 1]);
  const meanFinal = finalVals.reduce((a, b) => a + b, 0) / finalVals.length;
  let variance = finalVals.reduce((a, b) => a + (b - meanFinal) * (b - meanFinal), 0) / finalVals.length;
  const stdFinal = Math.sqrt(variance);
  const volatilityIndex = meanFinal !== 0 ? stdFinal / Math.abs(meanFinal) : stdFinal;

  const target = params.target;
  let probHitTarget = null;
  if (typeof target === 'number') {
    const count = finalVals.filter((v) => v >= target).length;
    probHitTarget = count / finalVals.length;
  }

  const summary = {
    expectedRevenueRange: { low: agg.p5[agg.p5.length - 1], high: agg.p95[agg.p95.length - 1] },
    worstCase: agg.min[agg.min.length - 1],
    bestCase: agg.max[agg.max.length - 1],
    volatilityIndex,
    probabilityOfHittingTarget: probHitTarget,
  };

  console.log(`[montecarlo] aggregation complete. meanFinal=${Math.round(meanFinal)}, stdFinal=${Math.round(stdFinal)}, volatilityIndex=${volatilityIndex.toFixed(4)}, probHitTarget=${probHitTarget}`);

  const results = { params: { ...params, days, simulations }, aggregated: agg, summary };

  // attach debug information when requested
  if (params.debug) {
    results.debug = {
      historicalLoaded: historical,
      rawRowsCount: typeof debugRowsCount !== 'undefined' ? debugRowsCount : null,
      rawRowsSample: typeof debugRowsSample !== 'undefined' ? debugRowsSample : null
    };
  }

  // persist to DB (best-effort, don't fail forecast on DB error)
  try {
    //await insertForecast(params, results);
  } catch (err) {
    console.error('Failed to insert forecast:', err);
  }

  return results;
}
