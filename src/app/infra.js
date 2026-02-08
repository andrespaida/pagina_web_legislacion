/* src/app/infra.js - VERSIÓN FINAL OPTIMIZADA (Línea Azul Curva + Etiquetas) */
import { API_URL, formatoNumero } from './utils.js';

// 1. REGISTRO GLOBAL DEL PLUGIN DE ETIQUETAS
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

// Apagamos las etiquetas por defecto para que no ensucien las gráficas que no las necesitan
Chart.defaults.set('plugins.datalabels', {
    display: false
});

export async function initInfra() {
    console.log("📡 Cargando Dashboard Infraestructura FINAL...");
    
    try {
        const [resMovil, resEvo, resMercFijo, resCentral, resCable] = await Promise.all([
            fetch(`${API_URL}/conectividad-movil`),
            fetch(`${API_URL}/evolucion-internet-fijo`),
            fetch(`${API_URL}/mercado-internet-fijo`),
            fetch(`${API_URL}/centralizacion-internet`),
            fetch(`${API_URL}/cable-submarino`)
        ]);

        const movil = await resMovil.json();
        const evolucion = await resEvo.json();
        const mercadoFijo = await resMercFijo.json();
        const centralizacion = await resCentral.json();
        const cable = await resCable.json();

        // RENDERIZADO DE TODAS LAS GRÁFICAS
        renderInternetMovilShare(movil);
        renderComparativaMovil(movil);
        renderModalidadPago(movil);
        renderEvolucionFijo(evolucion); // <--- Aquí se aplica la línea azul curva
        renderTvVsInternet(evolucion);
        renderMercadoFijo(mercadoFijo);
        renderCentralizacion(centralizacion);
        renderCable(cable);

        console.log("✅ Dashboard cargado con estilos Senior.");

    } catch (error) { 
        console.error("❌ Error cargando infraestructura:", error);
    }
}

// --- GRÁFICA 1: PARTICIPACIÓN INTERNET MÓVIL (DONA) ---
function renderInternetMovilShare(data) {
    const ctx = document.getElementById('chartInternetMovil');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.operadora),
            datasets: [{
                data: data.map(d => d.participacion_internet_movil),
                backgroundColor: ['#4169E1', '#9370DB', '#C0C0C0'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '50%',
            plugins: {
                legend: { position: 'right' },
                datalabels: { // Etiquetas blancas dentro del pastel
                    display: true,
                    color: '#fff',
                    font: { weight: 'bold', size: 11 },
                    formatter: (val) => val + '%'
                }
            }
        }
    });
}
function renderComparativaMovil(data) {
    const ctx = document.getElementById('chartMovilComparativa');
    if (!ctx) return;

    // 1. LIMPIEZA TOTAL: Evita que se hereden configuraciones viejas
    const chartExistente = Chart.getChart(ctx);
    if (chartExistente) { chartExistente.destroy(); }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.operadora),
            datasets: [
                {
                    // ESTA DEBE IR PRIMERO EN EL ARRAY
                    label: 'Total Líneas',
                    data: data.map(d => d.total_lineas),
                    backgroundColor: '#e5e7eb', // PLOMO
                    // ELIMINAMOS 'order' PARA QUE SIGA EL FLUJO NATURAL DEL ARRAY
                    datalabels: { 
                        display: true,
                        anchor: 'end',
                        align: 'top',
                        color: '#000000', // NEGRO SÓLIDO
                        font: { weight: 'bold', size: 11 },
                        formatter: (val) => (val / 1000000).toFixed(1) + 'M'
                    }
                },
                {
                    // ESTA DEBE IR SEGUNDO EN EL ARRAY
                    label: 'Con Internet',
                    data: data.map(d => d.lineas_con_internet_estimadas),
                    backgroundColor: ['#ef4444', '#3b82f6', '#10b981'], // COLOR
                    datalabels: { 
                        display: true,
                        anchor: 'end',
                        align: 'top',
                        color: '#000000', // NEGRO SÓLIDO
                        font: { weight: 'bold', size: 11 },
                        formatter: (val) => (val / 1000000).toFixed(1) + 'M'
                    }
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // 2. FORZAR AGRUPACIÓN: Asegura que las barras se dibujen una tras otra
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: true, position: 'top' },
                datalabels: { display: true }
            },
            scales: { 
                y: { 
                    beginAtZero: true, 
                    ticks: { callback: (val) => (val / 1000000) + 'M' }
                } 
            }
        }
    });
}

// --- GRÁFICA 3: HOGARES CONECTADOS (LÍNEA AZUL CURVA PROFESIONAL) ---
function renderEvolucionFijo(data) {
    const ctx = document.getElementById('chartEvolucionFijo');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.periodo),
            datasets: [{
                label: 'Suscriptores',
                data: data.map(d => d.suscriptores_internet), 
                borderColor: '#2563eb', // Azul Senior
                borderWidth: 3,
                tension: 0.4, // <--- Esto hace la CURVA
                fill: true,
                backgroundColor: (context) => {
                    const ctxCanvas = context.chart.ctx;
                    const gradient = ctxCanvas.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.4)'); // Degradado azul
                    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
                    return gradient;
                },
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#2563eb',
                datalabels: { // Etiqueta solo al final para no saturar
                    display: (ctx) => ctx.dataIndex === ctx.dataset.data.length - 1,
                    align: 'top',
                    color: '#2563eb',
                    font: { weight: 'bold' },
                    formatter: (val) => (val / 1000000).toFixed(2) + 'M'
                }
            }]
        },
        options: { 
            responsive: true, maintainAspectRatio: false,
            scales: { x: { grid: { display: false } } }
        }
    });
}

// --- RESTO DE FUNCIONES (MANTENIDAS SIN CAMBIOS DE LÓGICA) ---

function renderModalidadPago(data) {
    const ctx = document.getElementById('chartModalidad');
    if (!ctx) return;
    const totalPrepago = data.reduce((sum, d) => sum + (d.prepago || 0), 0);
    const totalPospago = data.reduce((sum, d) => sum + (d.pospago || 0), 0);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Prepago', 'Pospago'],
            datasets: [{
                data: [totalPrepago, totalPospago],
                backgroundColor: ['#f59e0b', '#6366f1'],
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '60%',
            plugins: {
                legend: { position: 'bottom' },
                datalabels: {
                    display: true,
                    color: '#fff',
                    font: { weight: 'bold' },
                    formatter: (value, ctx) => {
                        let sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        return ((value * 100) / sum).toFixed(0) + "%";
                    }
                }
            }
        }
    });
}

function renderMercadoFijo(data) {
    const ctx = document.getElementById('chartMercadoFijo');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(d => d.proveedor),
            datasets: [{
                data: data.map(d => d.participacion),
                backgroundColor: ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#9ca3af'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12 } },
                datalabels: {
                    display: true,
                    color: '#fff',
                    font: { weight: 'bold', size: 10 },
                    formatter: (value) => value > 5 ? value + '%' : ''
                }
            }
        }
    });
}

function renderTvVsInternet(data) {
    const ctx = document.getElementById('chartTvInternet');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.periodo),
            datasets: [
                {
                    label: 'TV Pagada',
                    data: data.map(d => d.suscriptores_tv),
                    borderColor: '#ef4444',
                    yAxisID: 'y',
                    tension: 0.3, borderWidth: 3
                },
                {
                    label: 'Internet',
                    data: data.map(d => d.suscriptores_internet),
                    borderColor: '#3b82f6',
                    yAxisID: 'y1',
                    tension: 0.3, borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { type: 'linear', position: 'left' },
                y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false } }
            }
        }
    });
}

function renderCable(data) {
    const ctx = document.getElementById('chartCable');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(d => d.proveedor),
            datasets: [{
                data: data.map(d => d.participacion),
                backgroundColor: ['#1e40af', '#ef4444', '#f59e0b', '#10b981'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12 } },
                datalabels: { display: true, color: '#fff', font: { weight: 'bold' }, formatter: (v) => v + '%' }
            }
        }
    });
}

function renderCentralizacion(data) {
    const container = document.getElementById('centralizacionCards');
    if (!container) return;
    container.innerHTML = '';
    data.forEach(item => {
        const card = `
            <div class="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-slate-900 flex flex-col transition-all hover:shadow-md">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Provincia</span>
                    <span class="text-[10px] font-black px-2 py-0.5 bg-slate-100 rounded text-slate-600">Métrica 2026</span>
                </div>
                <h4 class="text-xl font-black text-slate-900 mb-1 tracking-tighter">${item.provincia}</h4>
                <div class="flex items-baseline gap-1 mt-2">
                    <div class="text-3xl font-black text-blue-600">${item.porcentaje}%</div>
                    <div class="text-[10px] font-bold text-slate-400 uppercase">Share</div>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-1.5 my-4">
                    <div class="h-full rounded-full bg-blue-600 transition-all duration-1000" style="width: ${item.porcentaje}%"></div>
                </div>
                <p class="text-[11px] text-slate-500 font-medium">
                    ${formatoNumero.format(item.suscriptores_estimados)} suscriptores activos
                </p>
            </div>
        `;
        container.innerHTML += card;
    });
}