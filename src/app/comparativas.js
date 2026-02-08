/* src/app/comparativas.js - Comparativas internacionales (UN EGDI/E-Participation + marco legal) */

import { API_URL } from './utils.js';

// Plugin de etiquetas (si existe)
if (typeof ChartDataLabels !== 'undefined') {
  Chart.register(ChartDataLabels);
}

Chart.defaults.set('plugins.datalabels', { display: false });

function fmt4(n) {
  if (n === null || n === undefined || n === '') return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  return num.toFixed(4);
}

function fmtPct(n, d = 1) {
  if (n === null || n === undefined || n === '') return '—';
  const num = Number(n);
  if (Number.isNaN(num)) return '—';
  return `${(num * 100).toFixed(d)}%`;
}

function safeText(s) {
  return (s ?? '').toString();
}

export async function initComparativas() {
  console.log('🌍 Cargando Comparativas...');

  try {
    const [resIdx, resMarco] = await Promise.all([
      fetch(`${API_URL}/indices-un-2024`),
      fetch(`${API_URL}/marco-legal`)
    ]);

    const indices = await resIdx.json();
    const marco = await resMarco.json();

    renderKPIs(indices);
    renderCharts(indices);
    renderTablaIndices(indices);
    renderTablaMarco(marco);
    renderFuentes(indices, marco);

    console.log('✅ Comparativas listas.');
  } catch (err) {
    console.error('❌ Error cargando comparativas:', err);
    const cont = document.getElementById('kpi-container');
    if (cont) {
      cont.innerHTML = '<div class="bg-white p-6 rounded-xl shadow-sm border border-red-200 text-red-700 font-bold">Error cargando datos de comparativas. Revisa el servidor.</div>';
    }
  }
}

function findByPais(rows, pais) {
  return rows.find(r => (r.pais || '').toLowerCase() === pais.toLowerCase());
}

function renderKPIs(indices) {
  const ec = findByPais(indices, 'Ecuador');
  const us = findByPais(indices, 'Estados Unidos');
  const world = findByPais(indices, 'Promedio mundial');

  if (!ec) return;

  // Ecuador
  const egdi = Number(ec.egdi_2024);
  const egdiRank = ec.egdi_rank_2024;
  const epart = Number(ec.epart_2024);
  const epartRank = ec.epart_rank_2024;

  const elEgdi = document.getElementById('kpi-egdi');
  const elEgdiRank = document.getElementById('kpi-egdi-rank');
  const elEpart = document.getElementById('kpi-epart');
  const elEpartRank = document.getElementById('kpi-epart-rank');

  if (elEgdi) elEgdi.textContent = fmt4(egdi);
  if (elEgdiRank) elEgdiRank.textContent = `Rank: ${egdiRank || '—'}`;
  if (elEpart) elEpart.textContent = fmt4(epart);
  if (elEpartRank) elEpartRank.textContent = `Rank: ${epartRank || '—'}`;

  // Ecuador vs US (ratio)
  if (us?.egdi_2024) {
    const ratio = egdi / Number(us.egdi_2024);
    const el = document.getElementById('kpi-vs-us');
    const sub = document.getElementById('kpi-vs-us-sub');
    const bar = document.getElementById('kpi-vs-us-bar');

    if (el) el.textContent = fmtPct(ratio, 1);
    if (sub) sub.textContent = `0.7800 / ${fmt4(us.egdi_2024)} (EE.UU.)`;
    if (bar) bar.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;
  }

  // Ecuador vs World avg
  if (world?.egdi_2024) {
    const ratio = egdi / Number(world.egdi_2024);
    const el = document.getElementById('kpi-vs-world');
    const sub = document.getElementById('kpi-vs-world-sub');
    const bar = document.getElementById('kpi-vs-world-bar');

    if (el) el.textContent = fmtPct(ratio, 1);
    if (sub) sub.textContent = `0.7800 / ${fmt4(world.egdi_2024)} (promedio)`;
    if (bar) bar.style.width = `${Math.max(0, Math.min(100, ratio * 100))}%`;
  }
}

function renderCharts(indices) {
  const sinPromedio = indices.filter(r => (r.pais || '') !== 'Promedio mundial');

  // --- EGDI ---
  const egdiRows = [...sinPromedio].sort((a, b) => Number(b.egdi_2024) - Number(a.egdi_2024));
  const labelsEgdi = egdiRows.map(r => r.pais);
  const dataEgdi = egdiRows.map(r => Number(r.egdi_2024));

  const ctxEgdi = document.getElementById('chartEgdi');
  if (ctxEgdi) {
    const prev = Chart.getChart(ctxEgdi);
    if (prev) prev.destroy();

    new Chart(ctxEgdi, {
      type: 'bar',
      data: {
        labels: labelsEgdi,
        datasets: [{
          label: 'EGDI 2024',
          data: dataEgdi,
          backgroundColor: labelsEgdi.map(p => p === 'Ecuador' ? '#2563eb' : '#e5e7eb'),
          borderColor: labelsEgdi.map(p => p === 'Ecuador' ? '#1d4ed8' : '#e5e7eb'),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${fmt4(ctx.parsed.y)}`
            }
          },
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'top',
            color: '#0f172a',
            font: { weight: 'bold', size: 11 },
            formatter: (val) => Number(val).toFixed(3)
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 1,
            grid: { color: 'rgba(226,232,240,0.8)' },
            ticks: {
              callback: (v) => Number(v).toFixed(1)
            }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // --- EPART ---
  const epartRows = [...sinPromedio].sort((a, b) => Number(b.epart_2024) - Number(a.epart_2024));
  const labelsEpart = epartRows.map(r => r.pais);
  const dataEpart = epartRows.map(r => Number(r.epart_2024));

  const ctxEpart = document.getElementById('chartEpart');
  if (ctxEpart) {
    const prev = Chart.getChart(ctxEpart);
    if (prev) prev.destroy();

    new Chart(ctxEpart, {
      type: 'bar',
      data: {
        labels: labelsEpart,
        datasets: [{
          label: 'E-Participation 2024',
          data: dataEpart,
          backgroundColor: labelsEpart.map(p => p === 'Ecuador' ? '#4f46e5' : '#e5e7eb'),
          borderColor: labelsEpart.map(p => p === 'Ecuador' ? '#4338ca' : '#e5e7eb'),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${fmt4(ctx.parsed.y)}`
            }
          },
          datalabels: {
            display: true,
            anchor: 'end',
            align: 'top',
            color: '#0f172a',
            font: { weight: 'bold', size: 11 },
            formatter: (val) => Number(val).toFixed(3)
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 1,
            grid: { color: 'rgba(226,232,240,0.8)' },
            ticks: {
              callback: (v) => Number(v).toFixed(1)
            }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }
}

function renderTablaIndices(indices) {
  const tbody = document.getElementById('tabla-indices-body');
  if (!tbody) return;

  const rows = [...indices].sort((a, b) => {
    // Mantener "Promedio mundial" al final
    if (a.pais === 'Promedio mundial') return 1;
    if (b.pais === 'Promedio mundial') return -1;
    return Number(b.egdi_2024) - Number(a.egdi_2024);
  });

  tbody.innerHTML = '';
  rows.forEach(r => {
    const isEc = r.pais === 'Ecuador';
    const tr = document.createElement('tr');
    tr.className = isEc ? 'bg-blue-50/40' : '';

    tr.innerHTML = `
      <td class="py-3 pr-4 font-bold text-slate-800">${safeText(r.pais)}</td>
      <td class="py-3 pr-4 font-mono">${fmt4(r.egdi_2024)}</td>
      <td class="py-3 pr-4 text-slate-500 font-bold">${r.egdi_rank_2024 || '—'}</td>
      <td class="py-3 pr-4 font-mono">${fmt4(r.epart_2024)}</td>
      <td class="py-3 text-slate-500 font-bold">${r.epart_rank_2024 || '—'}</td>
    `;

    tbody.appendChild(tr);
  });
}

function renderTablaMarco(marco) {
  const tbody = document.getElementById('tabla-marco-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  marco.forEach(r => {
    const isEc = r.pais === 'Ecuador';
    const tr = document.createElement('tr');
    tr.className = isEc ? 'bg-blue-50/40' : '';

    const firma = r.firma_electronica_year ? `<a class="text-blue-600 font-bold hover:underline" href="${r.firma_electronica_ref}" target="_blank">${r.firma_electronica_year}</a>` : '—';
    const datos = r.proteccion_datos_year ? `<a class="text-blue-600 font-bold hover:underline" href="${r.proteccion_datos_ref}" target="_blank">${r.proteccion_datos_year}</a>` : (r.proteccion_datos_ref ? `<a class="text-blue-600 font-bold hover:underline" href="${r.proteccion_datos_ref}" target="_blank">N/A</a>` : '—');
    const tram = r.gov_digital_year ? `<a class="text-blue-600 font-bold hover:underline" href="${r.gov_digital_ref}" target="_blank">${r.gov_digital_year}</a>` : '—';

    tr.innerHTML = `
      <td class="py-3 pr-4 font-bold text-slate-800">${safeText(r.pais)}</td>
      <td class="py-3 pr-4">${firma}</td>
      <td class="py-3 pr-4">${datos}</td>
      <td class="py-3 pr-4">${tram}</td>
      <td class="py-3 text-slate-600">${safeText(r.nota)}</td>
    `;

    tbody.appendChild(tr);
  });
}

function renderFuentes(indices, marco) {
  const cont = document.getElementById('fuentes-container');
  if (!cont) return;

  const links = new Map();

  indices.forEach(r => {
    if (r.fuente_url) links.set(`ONU · ${r.pais}`, r.fuente_url);
  });

  marco.forEach(r => {
    if (r.firma_electronica_ref) links.set(`${r.pais} · Firma electrónica`, r.firma_electronica_ref);
    if (r.proteccion_datos_ref) links.set(`${r.pais} · Protección de datos`, r.proteccion_datos_ref);
    if (r.gov_digital_ref) links.set(`${r.pais} · Trámites / Gobierno digital`, r.gov_digital_ref);
  });

  cont.innerHTML = '';

  [...links.entries()].slice(0, 16).forEach(([label, url]) => {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all';
    a.innerHTML = `
      <span class="text-sm font-bold text-slate-800">${safeText(label)}</span>
      <span class="text-[10px] font-black text-blue-600 uppercase tracking-widest">abrir</span>
    `;
    cont.appendChild(a);
  });
}
