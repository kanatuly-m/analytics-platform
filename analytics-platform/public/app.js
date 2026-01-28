let chartInstance = null;

const qs = (id) => document.getElementById(id);

function setStatus(msg, isError = false) {
  const el = qs("status");
  el.textContent = msg;
  el.className = "status " + (isError ? "err" : "ok");
}

function fmt(n) {
  if (n === null || n === undefined) return "—";
  return (Math.round(n * 100) / 100).toString();
}

async function fetchJSON(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

function buildQuery({ field, start_date, end_date }) {
  const p = new URLSearchParams();
  p.set("field", field);
  if (start_date) p.set("start_date", start_date);
  if (end_date) p.set("end_date", end_date);
  p.set("limit", "1000");
  return p.toString();
}

function renderMetrics(m) {
  qs("avg").textContent = fmt(m.avg);
  qs("min").textContent = fmt(m.min);
  qs("max").textContent = fmt(m.max);
  qs("stdDev").textContent = fmt(m.stdDev);
  qs("count").textContent = fmt(m.count);
}

function renderChart(type, labels, values, field) {
  const ctx = qs("chart").getContext("2d");
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [{ label: field, data: values, tension: 0.25 }],
    },
    options: {
      responsive: true,
      scales: {
        x: { ticks: { maxRotation: 0 } },
        y: { beginAtZero: false },
      },
    },
  });
}

qs("controls").addEventListener("submit", async (e) => {
  e.preventDefault();

  const field = qs("field").value;
  const start_date = qs("start_date").value;
  const end_date = qs("end_date").value;
  const chartType = qs("chartType").value;

  try {
    setStatus("Loading… ⏳");

    const q = buildQuery({ field, start_date, end_date });
    const ts = await fetchJSON(`/api/measurements?${q}`);
    const metrics = await fetchJSON(`/api/measurements/metrics?${q}`);

    const points = ts.data;
    const labels = points.map((p) => new Date(p.timestamp).toLocaleString());
    const values = points.map((p) => p[field]);

    renderMetrics(metrics.metrics);
    renderChart(chartType, labels, values, field);

    setStatus(`Done ✅ Points: ${points.length}`);
  } catch (err) {
    setStatus(err.message, true);
    renderMetrics({ avg: null, min: null, max: null, stdDev: null, count: null });
    if (chartInstance) chartInstance.destroy();
  }
});
