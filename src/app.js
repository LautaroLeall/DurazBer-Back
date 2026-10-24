import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import peachRoutes from './routes/peachRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // En desarrollo permitir orígenes locales
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Chequeo de salud ultrarrápido para despertar de cold-starts (Render / Atlas)
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    server: 'awake',
    database: isDbConnected ? 'connected' : 'connecting_or_sleeping',
    timestamp: new Date().toISOString()
  });
});

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/peaches', peachRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.json({
    project: 'DurazBer',
    version: '1.0.0',
    description: 'API REST - Contador 3D de duraznos y analítica comparativa rodante de 3 meses',
    author: 'Lautaro Leal Del Prete (LLDP)',
    status: 'online',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      peaches: '/api/peaches',
      analytics: '/api/analytics'
    }
  });
});

app.use((err, req, res, next) => {
  console.error(`💥 Error no controlado: ${err.stack}`);
  res.status(500).json({ message: err.message || 'Error interno del servidor' });
});

export default app;
