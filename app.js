
async function postCSV(file){
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/import', { method: 'POST', body: form });
  return res.json();
}

async function getRounds(limit=500){
  const res = await fetch('/api/rounds?limit=' + limit);
  return res.json();
}

async function getStats(window=50){
  const res = await fetch('/api/stats?window=' + window);
  return res.json();
}

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = document.getElementById('fileInput').files[0];
  if (!f) return alert('Escolhe um ficheiro');
  document.getElementById('importResult').innerText = 'Enviando...';
  const r = await postCSV(f);
  document.getElementById('importResult').innerText = JSON.stringify(r, null, 2);
  await refresh();
});

document.getElementById('refreshBtn').addEventListener('click', refresh);
document.getElementById('simulateBtn').addEventListener('click', async () => {
  document.getElementById('simResult').innerText = 'Running...';
  const body = { strategy: 'flat', bankroll: 100, baseStake: 1, rounds: 100, sims: 200, cashout: 1.5 };
  const res = await fetch('/api/simulate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const data = await res.json();
  document.getElementById('simResult').innerText = JSON.stringify(data, null, 2);
});

let chart;
async function refresh(){
  const data = await getRounds(500);
  const rounds = data.rounds || [];
  const labels = rounds.map(r => r.timestamp_utc || r.round_id);
  const multipliers = rounds.map(r => r.multiplier);
  const stats = await getStats(50);
  document.getElementById('statsArea').innerText = 'Últimos: ' + (stats.count||0) + ' | %<1.5: ' + (stats.pct_below_1_5||0).toFixed(3) + ' | %≥2: ' + (stats.pct_above_2||0).toFixed(3) + ' | média: ' + (stats.mean||0).toFixed(3);

  if (chart) chart.destroy();
  const ctx = document.getElementById('multChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Multiplier',
        data: multipliers,
        fill: false,
        tension: 0.1,
        pointRadius: 2
      }]
    },
    options: {
      interaction: { mode: 'index' },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// initial
refresh();
