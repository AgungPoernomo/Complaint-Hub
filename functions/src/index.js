// Entry point Cloud Function `api` (Express). Endpoint lain ditambahkan di fase berikutnya.
const { onRequest } = require('firebase-functions/v2/https');
const express = require('express');
const cors = require('cors');

const app = express();

// CORS: bebas di emulator; di production dibatasi ke domain Hosting (Fase 6).
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

const router = express.Router();

// Cek layanan (publik)
router.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Lewat Hosting rewrite path berawalan /api; lewat URL langsung fungsi tidak.
app.use('/api', router);
app.use('/', router);

// Format error seragam (README Bagian 8)
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Endpoint tidak ditemukan.' } });
});

exports.api = onRequest({ region: 'asia-southeast2' }, app);

