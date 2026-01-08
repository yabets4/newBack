import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import path from 'path';
import pool from '../../../loaders/db.loader.js';
import { insertForecast } from './salesForecast.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Aggregates simulation results into statistical trajectories (mean, p5, p95).
 */
function aggregateTrajectories(allTrajs, days) {
  const sims = allTrajs.length;
  const mean = new Array(days).fill(0);
  const min = new Array(days).fill(Infinity);
  const max = new Array(days).fill(-Infinity);
  const p5 = new Array(days).fill(0);
  const p95 = new Array(days).fill(0);

  const percentile = (sorted, p) => {
    if (!sorted.length) return 0;
    const idx = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return lo === hi ? sorted[lo] : sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
  };

  for (let t = 0; t < days; t++) {
    const vals = new Array(sims);
    for (let s = 0; s < sims; s++) vals[s] = allTrajs[s][t];
    vals.sort((a, b) => a - b);

    mean[t] = vals.reduce((a, b) => a + b, 0) / sims;
    min[t] = vals[0];
    max[t] = vals[vals.length - 1];
    p5[t] = percentile(vals, 5);
    p95[t] = percentile(vals, 95);
  }
  return { mean, min, max, p5, p95 };
}

/**
 * Fetches historical revenue data for a given company.
 * LOOKBACK: 90 days from the forecast start date.
 */
async function getHistoricalRevenue(companyId, startDate) {
  try {
    const lookbackDays = 90;
    const endD = new Date(startDate);
    const startD = new Date(endD);
    startD.setDate(startD.getDate() - lookbackDays);

    console.log(`[montecarlo:service] fetching historicals for company=${companyId} from ${startD.toISOString().slice(0, 10)} to ${endD.toISOString().slice(0, 10)}`);

    const q = `
      SELECT order_date::date as d, SUM(total_amount) as total
      FROM orders
      WHERE company_id = $1 AND order_date::date >= $2 AND order_date::date < $3
      GROUP BY d ORDER BY d
    `;

    const { rows } = await pool.query(q, [companyId, startD.toISOString().slice(0, 10), endD.toISOString().slice(0, 10)]);

    // Map existing data to daily buckets
    const dataMap = rows.reduce((acc, r) => {
      const key = new Date(r.d).toISOString().slice(0, 10);
      acc[key] = parseFloat(r.total || 0);
      return acc;
    }, {});

    const historical = [];
    for (let i = 0; i < lookbackDays; i++) {
      const d = new Date(startD);
      d.setDate(d.getDate() + i);
      historical.push(dataMap[d.toISOString().slice(0, 10)] || 0);
    }

    return historical;
  } catch (err) {
    console.error('[montecarlo:service] historical data retrieval failed:', err);
    return [];
  }
}

/**
 * Main entrance for running Monte Carlo revenue forecasts.
 */
export async function runForecast(params = {}) {
  const { companyId, simulationCount = 2000, chaosIntensity = 0.5 } = params;
  const startDate = new Date(params.startDate);
  const endDate = new Date(params.endDate);
  const days = Math.max(1, Math.ceil((endDate - startDate) / 86400000) + 1);

  // 1. Data Intelligence Gathering
  const historical = await getHistoricalRevenue(companyId, startDate);

  // 2. Baseline Architecture
  // If no historical data, we provide a default baseline to avoid flatline charts
  const baselineValue = historical.length > 0 && historical.some(v => v > 0)
    ? historical.reduce((a, b) => a + b, 0) / historical.length
    : 1000; // Sensible default for new accounts

  console.log(`[montecarlo:service] baseline target derived: ${baselineValue.toFixed(2)} (using ${historical.filter(v => v > 0).length} active data points)`);

  const workerUrl = new URL('./montecarlo.worker.js', import.meta.url);
  const resultsTrajs = [];

  // 3. Parallel Simulation Orchestration
  const workerTask = (simsToRun) => new Promise((resolve, reject) => {
    const worker = new Worker(workerUrl, {
      workerData: {
        simulations: simsToRun,
        days,
        options: {
          baselineType: params.baselineModelType || 'linear',
          chaosIntensity,
          historical,
          baselineParams: { startValue: baselineValue, ...params.baselineParams }
        }
      }
    });

    worker.on('message', (msg) => {
      if (msg.trajectories) resultsTrajs.push(...msg.trajectories);
    });
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker terminal failure [code ${code}]`));
      else resolve();
    });
  });

  // Split simulations into logical chunks (parallel workers)
  const CHUNK_SIZE = 1000;
  const tasks = [];
  for (let i = 0; i < simulationCount; i += CHUNK_SIZE) {
    tasks.push(workerTask(Math.min(CHUNK_SIZE, simulationCount - i)));
  }

  await Promise.all(tasks);

  // 4. Statistical Synthesis
  const agg = aggregateTrajectories(resultsTrajs, days);

  // Final assessment metrics
  const finalVals = resultsTrajs.map(r => r[r.length - 1]);
  const meanFinal = finalVals.reduce((a, b) => a + b, 0) / finalVals.length;
  const variance = finalVals.reduce((a, b) => a + Math.pow(b - meanFinal, 2), 0) / finalVals.length;
  const stdFinal = Math.sqrt(variance);

  // 5. Result Persistence (Best-effort)
  try {
    await insertForecast(companyId, params, { summary, meta: { totalRuns: resultsTrajs.length, baseline: baselineValue } });
  } catch (err) {
    console.error('[montecarlo:service] failed to persist simulation results:', err);
  }

  const summary = {
    expectedRevenueRange: { low: agg.p5[agg.p5.length - 1], high: agg.p95[agg.p95.length - 1] },
    worstCase: agg.min[agg.min.length - 1],
    bestCase: agg.max[agg.max.length - 1],
    volatilityIndex: meanFinal !== 0 ? stdFinal / Math.abs(meanFinal) : 0,
    probabilityOfHittingTarget: params.target ? finalVals.filter(v => v >= params.target).length / finalVals.length : null
  };

  return {
    params: { ...params, days, simulations: simulationCount },
    aggregated: agg,
    summary,
    meta: {
      totalRuns: resultsTrajs.length,
      dataBaseline: baselineValue,
      historicalCount: historical.length
    }
  };
}
