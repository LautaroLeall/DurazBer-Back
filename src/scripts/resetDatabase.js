import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import PeachLog from '../models/PeachLog.js';

const resetDatabase = async () => {
  try {
    await connectDB();

    console.log('🧹 [DurazBer] Eliminando TODOS los datos anteriores de la base de datos...');
    await PeachLog.deleteMany({});
    await User.deleteMany({});
    console.log('✨ Base de datos completamente limpia.');

    console.log('👤 Creando usuarios reales solicitados...');

    // 1. Lautaro
    const userLautaro = await User.create({
      name: 'Lautaro Leal Del Prete',
      email: 'lautaroleal4@gmail.com',
      password: 'NOLASABES',
      dailyGoal: 4,
      streak: 0,
      avatar: '/avatar/avatar-lau.png'
    });
    console.log(`✅ Usuario creado: ${userLautaro.name} (${userLautaro.email})`);

    // 2. Berni
    const userBerni = await User.create({
      name: 'Berni',
      email: 'berniiapass@gmail.com',
      password: 'LaMuda00',
      dailyGoal: 3,
      streak: 0,
      avatar: '/avatar/avatar-ber.png'
    });
    console.log(`✅ Usuario creado: ${userBerni.name} (${userBerni.email})`);

    console.log('🚀 Base de datos inicializada 100% REAL sin datos mockeados.');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error al reiniciar base de datos: ${error.message}`);
    process.exit(1);
  }
};

resetDatabase();
