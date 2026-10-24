import mongoose from 'mongoose';
import dns from 'dns';

// Resolver automáticamente querySrv en Windows usando servidores DNS públicos (Google / Cloudflare)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignorar si el entorno bloquea la reconfiguración de DNS
}

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/durazber';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`🍑 [DurazBer] MongoDB conectado exitosamente: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ [DurazBer] Advertencia de conexión a MongoDB: ${error.message}`);
    console.warn(`💡 Verificá que la IP esté permitida en MongoDB Atlas (Network Access: 0.0.0.0/0) o revisá las credenciales en backend/.env`);
    return null;
  }
};

export default connectDB;
