/* src/app/main.js - Lógica del HOME (Firmas) */

import { fetchAllData } from './api.js';
import { renderDashboard } from './ui.js';

// Esta función se llama cada vez que el Router carga la página 'home'
export async function initHome() {
    console.log("🏠 Iniciando Dashboard de Firmas...");
    
    // 1. Pedimos los datos (API)
    const data = await fetchAllData();
    
    // 2. Si llegaron bien, dibujamos (UI)
    if (data) {
        renderDashboard(data);
        console.log("✅ Dashboard renderizado.");
    } else {
        console.error("❌ No hay datos para mostrar en Home.");
    }
}