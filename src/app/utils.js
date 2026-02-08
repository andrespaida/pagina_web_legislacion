/* src/app/utils.js - Formatos y Constantes */

export const API_URL = 'http://localhost:3000/api';

export const formatoMoneda = new Intl.NumberFormat('es-EC', { 
    style: 'currency', 
    currency: 'USD', 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
});

export const formatoNumero = new Intl.NumberFormat('es-EC');