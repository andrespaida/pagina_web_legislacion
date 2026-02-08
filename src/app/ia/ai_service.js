let baseDeConocimientoTotal = null;

async function cargarTodaLaData() {
    if (baseDeConocimientoTotal) return baseDeConocimientoTotal;

    const rutas = [
        '/data/SAI/cable_submarino.csv',
        '/data/SAI/centralizacion_internet.csv',
        '/data/SAI/conectividad_movil.csv',
        '/data/SAI/evolucion_internet_fijo.csv',
        '/data/SAI/mercado_internet_fijo.csv',
        '/data/SMA/historico.csv',
        '/data/SMA/mercado.csv',
        '/data/SMA/metodologia.csv'
    ];

    try {
        const respuestas = await Promise.all(
            rutas.map(url => fetch(url).then(r => r.text()))
        );

        baseDeConocimientoTotal = `
            CONTENIDO:
            ${respuestas.map(r => r.slice(0, 200)).join('\n')}
        `;

        return baseDeConocimientoTotal;
    } catch (e) {
        console.error(e);
        return "Sin datos locales";
    }
}


export async function consultarIA(preguntaUsuario) {
    try {
        const datosLocales = await cargarTodaLaData();

        const resp = await fetch('/api/consulta', {

            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pregunta: `${preguntaUsuario}\n\nCONTEXTO:\n${datosLocales}`
            })
        });

        const data = await resp.json();
        return data.respuesta;

    } catch (error) {
        console.error(error);
        return "Error consultando IA";
    }
}