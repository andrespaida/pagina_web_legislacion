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
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname)); // Sirve todo desde la raíz

// Ruta principal (HTML)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index', 'index.html'));
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

    const systemPrompt = `
Eres el Analista Senior del Observatorio Digital. Tu conocimiento es HÍBRIDO.

FUENTES DISPONIBLES:
- LOCAL (Contexto adjunto): Úsalo EXCLUSIVAMENTE para datos históricos y técnicos de Ecuador.
- GLOBAL (Google Search): Úsalo OBLIGATORIAMENTE para leyes, trámites y comparativas internacionales.

REGLAS CRÍTICAS:
1. PROHIBIDO decir "no tengo datos comparativos".
2. Para leyes: explica su razón de ser y vigencia actual.
3. Si mezclan Ecuador con otro país, usa CSV para Ecuador y Search para el otro.
4. Máximo 50 palabras. Tono técnico.
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ googleSearch: {} }]
    });

    const promptFinal = `
${systemPrompt}

PREGUNTA DEL USUARIO:
${pregunta}
`;

    const result = await model.generateContent(promptFinal);

    res.json({ respuesta: result.response.text() });

  } catch (error) {
    console.error("ERROR GEMINI:", error);
    res.status(500).json({ respuesta: "Error consultando IA" });
  }
});


