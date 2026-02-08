
import { initHome } from './main.js';
import { initInfra } from './infra.js';
import { initComparativas } from './comparativas.js';
import { renderChatbot } from './ia/chat_ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar Estructura Fija
    await cargarComponente('header-container', '/views/header.html');
    await cargarComponente('footer-container', '/views/footer.html');
    renderChatbot();
    // 2. Cargar Página Inicial
    cargarPagina('home');

    // 3. Escuchar clics
    document.addEventListener('click', (e) => {
        // Buscamos el ancestro más cercano con data-link por si hacen clic en el icono o texto interno
        const btn = e.target.closest('[data-link]');
        if (btn) {
            e.preventDefault();
            const pagina = btn.getAttribute('data-link');
            cargarPagina(pagina);
        }
    });
});

// NUEVA FUNCIÓN: Actualiza el color de los botones del menú
function actualizarEstadoMenu(paginaActiva) {
    const botones = document.querySelectorAll('.nav-btn');
    botones.forEach(btn => {
        if (btn.getAttribute('data-link') === paginaActiva) {
            btn.classList.add('nav-btn-active');
            btn.classList.remove('nav-btn-inactive');
        } else {
            btn.classList.remove('nav-btn-active');
            btn.classList.add('nav-btn-inactive');
        }
    });
}

async function cargarComponente(idContenedor, ruta) {
    const res = await fetch(ruta);
    const html = await res.text();
    document.getElementById(idContenedor).innerHTML = html;
}

async function cargarPagina(pagina) {
    const contenedor = document.getElementById('app-content');
    contenedor.innerHTML = '<p class="text-center mt-10">Cargando contenido...</p>';

    let rutaHtml = '';
    let funcionIniciadora = null;

    if (pagina === 'home') {
        rutaHtml = '/views/home.html';
        funcionIniciadora = initHome;
    } else if (pagina === 'infra') {
        rutaHtml = '/views/infra.html';
        funcionIniciadora = initInfra;
    } else if (pagina === 'comparativas') {
        rutaHtml = '/views/comparativas.html';
        funcionIniciadora = initComparativas;
    }

    try {
        const res = await fetch(rutaHtml);
        if (!res.ok) throw new Error('No se encontró la vista');
        const html = await res.text();

        contenedor.innerHTML = html;

        // CORRECCIÓN SENIOR: Llamamos a la actualización visual del menú
        actualizarEstadoMenu(pagina);

        if (funcionIniciadora) funcionIniciadora();

    } catch (error) {
        contenedor.innerHTML = `<h1 class="text-red-500 text-center">Error cargando ${pagina}</h1>`;
        console.error(error);
    }
}