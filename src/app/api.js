/* src/app/api.js - Lógica de Red */
import { API_URL } from './utils.js';

export async function fetchAllData() {
    console.log("🚀 Conectando al servidor en " + API_URL + "...");
    
    try {
        const [resHist, resMerc, resMet] = await Promise.all([
            fetch(`${API_URL}/historico`),
            fetch(`${API_URL}/mercado`),
            fetch(`${API_URL}/metodologia`)
        ]);

        if (!resHist.ok || !resMerc.ok || !resMet.ok) {
            throw new Error("Alguna de las APIs falló.");
        }

        const datosGlobales = await resHist.json();
        const mercadoRaw = await resMerc.json();
        const parametrosMetodologia = await resMet.json();

        // Procesar datos de mercado aquí mismo para devolverlos listos
        const datosMercado = {
            labels: mercadoRaw.map(item => item.entidad),
            values: mercadoRaw.map(item => item.usuarios),
            colors: mercadoRaw.map(item => item.color)
        };

        return { datosGlobales, datosMercado, parametrosMetodologia };

    } catch (error) {
        console.error("Error crítico de conexión:", error);
        alert("⚠️ Error de conexión con el Backend. Revisa la consola.");
        return null; // Retornamos null para manejar el error arriba
    }
}