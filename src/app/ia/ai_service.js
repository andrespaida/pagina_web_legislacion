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
        '/data/SMA/metodologia.csv',
        '/data/info.txt' // <--- 1. AGREGA TU RUTA AQUÍ
    ];

    try {
        const respuestas = await Promise.all(
            rutas.map(url => fetch(url).then(r => r.text()))
        );

        // 2. MEJORAMOS LA LÓGICA DE UNIÓN:
        // Los CSV se siguen recortando para no saturar, pero el TXT (última posición) lo incluimos mejor.
        baseDeConocimientoTotal = respuestas.map((contenido, index) => {
            const nombreArchivo = rutas[index].split('/').pop();
            
            // Si es el archivo .txt, tomamos más contenido (ej. 2000 caracteres)
            if (nombreArchivo.endsWith('.txt')) {
                return `ARCHIVO ${nombreArchivo}:\n${contenido.slice(0, 2000)}`;
            }
            
            // Para los CSV mantenemos el recorte actual para ahorrar espacio
            return `DATOS ${nombreArchivo}:\n${contenido.slice(0, 200)}`;
        }).join('\n\n---\n\n');

        return baseDeConocimientoTotal;
    } catch (e) {
        console.error("Error cargando archivos de data:", e);
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
                // Enviamos la pregunta con el contexto enriquecido
                pregunta: `Instrucción: Responde basado en el contexto proporcionado.\n\nCONTEXTO:\n${datosLocales}\n\nPREGUNTA DEL USUARIO: ${preguntaUsuario}`
            })
        });

        const data = await resp.json();
        return data.respuesta;

    } catch (error) {
        console.error(error);
        return "Error consultando IA";
    }
}