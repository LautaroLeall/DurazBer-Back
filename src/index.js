import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app.js';
import connectDB from './config/db.js';
import { initRetentionScheduler } from './utils/cleanupService.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Intentar conectar a MongoDB
  const conn = await connectDB();

  // Si conectó a MongoDB, iniciar el planificador de purga automática cada 3 meses
  if (conn) {
    initRetentionScheduler();
  }

  app.listen(PORT, () => {
    console.log(`🍑 [DurazBer Backend] Servidor corriendo en http://localhost:${PORT}`);
    console.log(`✨ Arquitectura Full Stack diseñada por Lautaro Leal Del Prete (LLDP)`);
    console.log(`⏱️ Política de retención: Purga automática de registros anteriores a 3 meses activada.`);
  });
};

startServer();
