
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const csvParse = require('csv-parse');
const path = require('path');

const upload = multer({ dest: 'uploads/' });
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory store
let rounds = []; // { timestamp_utc, round_id, multiplier }

function parseFloatSafe(x){
  const v = parseFloat(x);
  return isNaN(v) ? null : v;
}

// POST /api/import
app.post('/api/import', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  const pathFile = req.file.path;
  const content = fs.readFileSync(pathFile, 'utf8');
  csvParse(content, { columns: true, trim: true }, (err, records) => {
    if (err) {
      fs.unlinkSync(pathFile);
      return res.status(400).json({ error: 'invalid csv', detail: err.message });
    }
    const imported = records.map(r => ({
      timestamp_utc: r.timestamp_utc,
      round_id: r.round_id,
      multiplier: parseFloatSafe(r.multiplier)
    })).filter(r => r.multiplier !== null);
    rounds = rounds.concat(imported);
    fs.unlinkSync(pathFile);
    res.json({ status: 'ok', imported: imported.length });
  });
});

// GET /api/rounds?limit=200
app.get('/api/rounds', (req, res) => {
  const limit = parseInt(req.query.limit || '200', 10);
  res.json({ rounds: rounds.slice(-limit) });
});

// GET /api/stats?window=50
app.get('/api/stats', (req, res) => {
  const window = parseInt(req.query.window || '50', 10);
  const last = rounds.slice(-window).map(r => r.multiplier).filter(x => x !== null);
  if (last.length === 0) return res.json({ window, message: 'no data' });
  const pct_below_1_5 = last.filter(x => x < 1.5).length / last.length;
  const pct_above_2 = last.filter(x => x >= 2.0).length / last.length;
  const mean = last.reduce((a,b) => a+b,0)/last.length;
  const sorted = [...last].sort((a,b)=>a-b);
  const median = sorted[Math.floor((sorted.length-1)/2)];
  const percentiles = (p) => {
    if (sorted.length===0) return null;
    const idx = Math.floor(p/100*(sorted.length-1));
    return sorted[Math.max(0, Math.min(sorted.length-1, idx))];
  };
  res.json({ window, count: last.length, pct_below_1_5, pct_above_2, mean, median, p10: percentiles(10), p90: percentiles(90) });
});

// POST /api/simulate
// Body: { strategy: "flat"|"martingale", bankroll:100, baseStake:1, rounds:100, sims:1000, cashout:1.5 }
// We'll implement a bootstrap Monte-Carlo using empirical distribution from stored rounds.
app.post('/api/simulate', (req, res) => {
  const body = req.body || {};
  const strategy = body.strategy || 'flat';
  const bankroll = Number(body.bankroll) || 100;
  const baseStake = Number(body.baseStake) || 1;
  const roundsPerSim = parseInt(body.rounds || '100', 10);
  const sims = parseInt(body.sims || '1000', 10);
  const cashout = Number(body.cashout) || 1.5;
  const empirical = rounds.map(r => r.multiplier).filter(x => x !== null);
  if (empirical.length === 0) return res.status(400).json({ error: 'no empirical data to simulate' });

  function sample(){
    const idx = Math.floor(Math.random() * empirical.length);
    return empirical[idx];
  }

  const results = [];
  for (let s=0; s<sims; s++){
    let bal = bankroll;
    let stake = baseStake;
    for (let r=0; r<roundsPerSim; r++){
      if (bal < stake) { bal = 0; break; }
      const mult = sample();
      // cashout: if mult >= cashout, win gets stake*(cashout-1); else lose stake
      if (mult >= cashout) {
        const gain = stake * (cashout - 1);
        bal += gain;
      } else {
        bal -= stake;
      }
      // strategy adjust
      if (strategy === 'martingale') {
        if (mult >= cashout) {
          stake = baseStake;
        } else {
          stake = Math.min(bal, stake * 2);
        }
      } else { // flat
        stake = baseStake;
      }
      if (bal <= 0) { bal = 0; break; }
    }
    results.push(bal);
  }
  // summarize
  results.sort((a,b)=>a-b);
  const sum = results.reduce((a,b)=>a+b,0);
  const mean = sum / results.length;
  const median = results[Math.floor(results.length/2)];
  const ruinProb = results.filter(x=>x<=0).length / results.length;
  res.json({ sims, roundsPerSim, strategy, bankroll, baseStake, cashout, mean, median, ruinProb, resultsSample: results.slice(0,20) });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server listening on', port));
