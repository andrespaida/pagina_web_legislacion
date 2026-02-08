/* src/app/api.js - CORREGIDO PARA NAVEGACIÓN Y DATOS */
import { API_URL, formatoMoneda, formatoNumero } from './utils.js';

// YA NO usamos variables globales (let chartEvolucion = null) porque causan el error de pantalla blanca.
// Usaremos detección automática en el canvas.

export async function fetchAllData() {
    console.log("🚀 Conectando al servidor...");
    try {
        const [resHist, resMerc, resMet] = await Promise.all([
            fetch(`${API_URL}/historico`),
            fetch(`${API_URL}/mercado`),
            fetch(`${API_URL}/metodologia`)
        ]);

        if (!resHist.ok || !resMerc.ok || !resMet.ok) throw new Error("Error API");

        const datosGlobales = await resHist.json();
        const mercadoRaw = await resMerc.json();
        const parametrosMetodologia = await resMet.json();

        const datosMercado = {
            labels: mercadoRaw.map(item => item.entidad),
            values: mercadoRaw.map(item => item.usuarios),
            colors: mercadoRaw.map(item => item.color)
        };

        return { datosGlobales, datosMercado, parametrosMetodologia };

    } catch (error) {
        console.error("Error crítico:", error);
        return null;
    }
}

export function renderDashboard(data) {
    if (!data) return;

    const { datosGlobales, datosMercado, parametrosMetodologia } = data;

    // 1. ¡IMPORTANTE! LLENAR LAS TARJETAS (Árboles, Ahorro) PRIMERO
    // Esto asegura que los datos aparezcan siempre.
    calcularTotalesReales(datosGlobales); 

    // 2. RENDERIZAR GRÁFICAS (Con protección anti-pantalla blanca)
    renderizarGraficoEvolucion(datosGlobales);
    renderizarDona(datosMercado);
    
    // 3. TABLA Y FILTROS
    llenarTablaReferencia(parametrosMetodologia);
    llenarFiltroAnios(datosGlobales);

    // Lógica del filtro
    window.filtrarDatos = () => {
        const anioSeleccionado = document.getElementById('yearFilter').value;
        let datosFiltrados = datosGlobales;
        
        if (anioSeleccionado !== 'todos') {
            datosFiltrados = datosGlobales.filter(item => item.anio == anioSeleccionado);
        }
        
        // Al filtrar, actualizamos la gráfica existente (manteniendo la animación)
        renderizarGraficoEvolucion(datosFiltrados);
        // Y recalculamos los totales de las tarjetas
        calcularTotalesReales(datosFiltrados); 
    };
}

// --- FUNCIÓN DE GRÁFICA CORREGIDA (EVITA PANTALLA BLANCA) ---
function renderizarGraficoEvolucion(datos) {
    const ctx = document.getElementById('evolutionChart');
    if (!ctx) return;
    
    const labels = datos.map(d => d.fecha);
    const valores = datos.map(d => d.firmas);

    const chartExistente = Chart.getChart(ctx);

    if (chartExistente) {
        chartExistente.data.labels = labels;
        chartExistente.data.datasets[0].data = valores;
        chartExistente.update();
    } else {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Firmas Generadas',
                    data: valores,
                    borderColor: '#2563eb',
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, 'rgba(37, 99, 235, 0.4)');
                        gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');
                        return gradient;
                    },
                    borderWidth: 2,
                    pointRadius: 3, 
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#2563eb',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    datalabels: { display: false },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false, // Quita el cuadro de color pequeño
                        callbacks: {
                            title: (items) => '📅 ' + items[0].label,
                            label: (context) => {
                                // Recuperamos el objeto de datos completo para ese punto
                                const datoReal = datos[context.dataIndex]; 
                                return [
                                    '────────────────',
                                    '✍️ Firmas: ' + formatoNumero.format(datoReal.firmas),
                                    '💰 Ahorro: ' + formatoMoneda.format(datoReal.ahorro),
                                    '🌳 Árboles: ' + formatoNumero.format(datoReal.arboles)
                                ];
                            }
                        }
                    }
                },
                scales: { 
                    y: { beginAtZero: true, grid: { color: '#f3f4f6' } }, 
                    x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45 } } 
                }
            }
        });
    }
}

function renderizarDona(datosMercado) {
    const ctx = document.getElementById('marketShareChart');
    if(!ctx || !datosMercado.values.length) return;

    // PASO CLAVE: Destruir la anterior para que se redibuje la animación circular
    const chartExistente = Chart.getChart(ctx);
    if (chartExistente) {
        chartExistente.destroy();
    }

    const totalMercado = datosMercado.values.reduce((a, b) => a + b, 0);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: datosMercado.labels,
            datasets: [{
                data: datosMercado.values,
                backgroundColor: datosMercado.colors,
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '75%',
            plugins: { 
                legend: { position: 'right', labels: { boxWidth: 12, usePointStyle: true } },
                datalabels: { display: false } 
            }
        },
        plugins: [{
            id: 'textoCentral',
            beforeDraw: function(chart) {
                const width = chart.width, height = chart.height, ctx = chart.ctx;
                ctx.restore();
                const fontSize = (height / 120).toFixed(2);
                ctx.font = "bold " + fontSize + "em sans-serif";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#374151";
                const text = "Total";
                const text2 = formatoNumero.format(totalMercado);
                
                const textX = Math.round((width - ctx.measureText(text).width) / 2);
                const text2X = Math.round((width - ctx.measureText(text2).width) / 2);
                const textY = height / 2;
                ctx.fillText(text, textX, textY - 15);
                ctx.fillText(text2, text2X, textY + 15);
                ctx.save();
            }
        }]
    });
}

function calcularTotalesReales(datos) {
    if (!datos || datos.length === 0) {
        // Reset visual si no hay datos
        ['total-firmas', 'total-ahorro', 'total-arboles'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = "0";
        });
        return;
    }

    // Aseguramos la conversión a números para evitar errores de concatenación de texto
    const totalFirmas = datos.reduce((acc, item) => acc + (parseInt(item.firmas) || 0), 0);
    const totalAhorro = datos.reduce((acc, item) => acc + (parseFloat(item.ahorro) || 0), 0);
    const totalArboles = datos.reduce((acc, item) => acc + (parseInt(item.arboles) || 0), 0);

    const set = (id, val, fmt) => { 
        const el = document.getElementById(id); 
        if(el) el.innerText = fmt.format(val); 
    };

    set('total-firmas', totalFirmas, formatoNumero);
    set('total-ahorro', totalAhorro, formatoMoneda);
    set('total-arboles', totalArboles, formatoNumero);
}

function llenarTablaReferencia(p) {
    if (!p || Object.keys(p).length === 0) return;
    
    const set = (id, val) => { 
        const el = document.getElementById(id); 
        if(el) el.innerText = val; 
    };
    
    // SECCIÓN: Ahorro en Tiempo (Formato Moneda Estricto)
    set('ref-salario', formatoMoneda.format(p.salarioBasico)); 
    set('ref-minutos', p.minutosImpresion);
    set('ref-costo-tiempo', formatoMoneda.format(p.costoAhorroTiempo));
    
    // SECCIÓN: Ahorro en Insumos (Precisión de 3 decimales para costos unitarios)
    set('ref-responsabilidad', p.responsabilidadDoc);
    set('ref-resma', formatoMoneda.format(p.precioResma));
    set('ref-hoja', '$' + Number(p.precioHoja).toFixed(3));
    set('ref-outsourcing', formatoMoneda.format(p.precioOutsourcing));
    set('ref-implicados', p.implicados);
    set('ref-hojas-promedio', p.hojasPromedio);
    set('ref-total-imp', '$' + Number(p.precioTotalImpresion).toFixed(3));
    
    // SECCIÓN: Equivalencia Física
    set('ref-hojas-arbol', formatoNumero.format(p.hojasPorArbol));
    set('ref-resmas-arbol', p.resmasPorArbol);
    set('ref-hojas-resma', p.hojasPorResma);
}

function llenarFiltroAnios(datos) {
    const selector = document.getElementById('yearFilter');
    if (!selector) return;

    // Limpiamos y dejamos la opción base sin emojis
    selector.innerHTML = '<option value="todos">Histórico Completo</option>';

    // Aislamos años únicos y ordenamos de forma descendente
    const aniosUnicos = [...new Set(datos.map(d => d.anio))].sort((a, b) => b - a);

    aniosUnicos.forEach(anio => {
        if (anio) {
            const op = document.createElement('option');
            op.value = anio; 
            op.innerText = `Período ${anio}`; // Texto profesional
            selector.appendChild(op);
        }
    });
}