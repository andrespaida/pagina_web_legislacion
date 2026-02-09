import 'dotenv/config';
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cors from 'cors';
import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use(express.static(path.join(__dirname, 'src')));


// Ruta principal (HTML)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/index/index.html'));
});

// --- HELPER MAESTRO: Lee CSV desde cualquier subcarpeta ---
const leerCSV = (subcarpeta, archivo) => {
    return new Promise((resolve, reject) => {
        const ruta = path.join(__dirname, 'data', subcarpeta, archivo);
        
        fs.readFile(ruta, 'utf8', (err, data) => {
            if (err) {
                console.error(`❌ Error: No se encontró ${subcarpeta}/${archivo}`);
                return reject(err);
            }
            Papa.parse(data, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => resolve(results.data),
                error: (err) => reject(err)
            });
        });
    });
};

// HELPER para leer archivos de texto plano
const leerTXT = (archivo) => {
    return new Promise((resolve) => {
        const ruta = path.join(__dirname, 'data', archivo);
        fs.readFile(ruta, 'utf8', (err, data) => {
            if (err) {
                console.error(`❌ Error: No se encontró el archivo TXT en ${ruta}`);
                return resolve(""); // Retornamos vacío para no romper la IA
            }
            resolve(data);
        });
    });
};

// ==========================================
// 1. APIS DE "SMA" (Servicio Móvil / Firmas)
// ==========================================
app.get('/api/historico', async (req, res) => {
    try {
        const data = await leerCSV('SMA', 'historico.csv');
        res.json(data.filter(r => r.fecha));
    } catch (e) { res.status(500).json({ error: 'Error historico' }); }
});

app.get('/api/mercado', async (req, res) => {
    try {
        const data = await leerCSV('SMA', 'mercado.csv');
        res.json(data);
    } catch (e) { res.status(500).json({ error: 'Error mercado' }); }
});

app.get('/api/metodologia', async (req, res) => {
    try {
        const data = await leerCSV('SMA', 'metodologia.csv');
        let config = {};
        data.forEach(item => { if(item.parametro) config[item.parametro] = item.valor; });
        res.json(config);
    } catch (e) { res.status(500).json({ error: 'Error metodologia' }); }
});


// ==========================================
// 2. APIS DE "SAI" (Internet Fijo / Infraestructura)
// ==========================================

app.get('/api/conectividad-movil', async (req, res) => {
    try {
        // OJO: En tu carpeta real esto está en SAI
        const data = await leerCSV('SAI', 'conectividad_movil.csv');
        res.json(data);
    } catch (e) { 
        console.error(e);
        res.status(500).json({ error: 'Error conectividad movil' }); 
    }
});

app.get('/api/evolucion-internet-fijo', async (req, res) => {
    try {
        const data = await leerCSV('SAI', 'evolucion_internet_fijo.csv');
        res.json(data);
    } catch (e) { res.status(500).json({ error: 'Error evolucion fijo' }); }
});

app.get('/api/mercado-internet-fijo', async (req, res) => {
    try {
        const data = await leerCSV('SAI', 'mercado_internet_fijo.csv');
        res.json(data);
    } catch (e) { res.status(500).json({ error: 'Error mercado fijo' }); }
});

app.get('/api/centralizacion-internet', async (req, res) => {
    try {
        const data = await leerCSV('SAI', 'centralizacion_internet.csv');
        res.json(data);
    } catch (e) { res.status(500).json({ error: 'Error centralizacion' }); }
});

app.get('/api/cable-submarino', async (req, res) => {
    try {
        const data = await leerCSV('SAI', 'cable_submarino.csv');
        res.json(data);
    } catch (e) { res.status(500).json({ error: 'Error cable submarino' }); }
});


// ==========================================
// 3. APIS DE "COMPARATIVAS" (Marco legal + índices internacionales)
// ==========================================

app.get('/api/indices-un-2024', async (req, res) => {
    try {
        const data = await leerCSV('COMPARATIVAS', 'indices_un_2024.csv');
        res.json(data);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error indices UN 2024' });
    }
});

app.get('/api/marco-legal', async (req, res) => {
    try {
        const data = await leerCSV('COMPARATIVAS', 'marco_legal.csv');
        res.json(data);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error marco legal' });
    }
});


// --- START ---
app.listen(PORT, () => {
    console.log(`✅ Servidor LISTO en: http://localhost:${PORT}`);
    console.log(`   (No olvides reiniciar si haces cambios: Ctrl + C -> npm start)`);
});


app.post('/api/consulta', async (req, res) => {
  try {
    const { pregunta } = req.body;

    // 1. Leer el archivo de texto
    const infoExtra = await leerTXT('info.txt'); 

    // 2. Configurar el modelo SIN tools temporalmente para evitar el error 404
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
      // tools: [{ googleSearch: {} }] <--- Comenta esta línea si sigue fallando
    });

    // 3. System Prompt optimizado (Quitamos la mención a Search si lo desactivamos)
    const systemPrompt = `Eres el Analista Senior del Observatorio Digital. 
    Tu conocimiento se basa en los archivos adjuntos (CSV para datos técnicos y TXT para conceptos).
    Responde de forma técnica y breve (máximo 50 palabras).`;

    const promptFinal = `
${systemPrompt}

CONTEXTO LOCAL (TXT):
${infoExtra}

PREGUNTA DEL USUARIO:
${pregunta}
`;

    // 4. Generación de contenido
    const result = await model.generateContent(promptFinal);
    const response = await result.response;
    const text = response.text();

    res.json({ respuesta: text });

  } catch (error) {
    // Esto te dará el error real en los logs de Render si algo falla
    console.error("ERROR DETALLADO GEMINI:", error);
    res.status(500).json({ respuesta: "Lo siento, hubo un error procesando tu consulta en el servidor." });
  }
});