# DurazBer - Backend 🍑⚡

API RESTful y servicio backend para **DurazBer**, el sistema de gestión de cosecha, consumo botánico de duraznos, racha diaria y analítica de nutrición.

---

## 🌟 Características Principales

- **Autenticación Segura:** Registro e inicio de sesión con JWT (JSON Web Tokens) y contraseñas hasheadas mediante `bcryptjs`.
- **Registro de Cosecha Diaria:** Endpoints optimizados para registrar, consultar y sincronizar el consumo diario de duraznos en tiempo real.
- **Cálculo de Racha Automatizado:** Algoritmo de cálculo de días consecutivos de consumo con compensación horaria y persistencia.
- **Analítica Agregada:** Consultas por rangos de fechas (últimos 7 días, mensual) con desgloses de calorías, fibra y micronutrientes.
- **Base de Datos NoSQL:** Conexión flexible y escalable a **MongoDB Atlas** con esquemas de validación mediante Mongoose.
- **Seguridad y Limpieza:** Protección de cabeceras HTTP con `helmet`, configuración CORS restrictiva y tareas programadas de mantenimiento.

---

## 🛠️ Tecnologías

- **Entorno de Ejecución:** [Node.js](https://nodejs.org/)
- **Framework Web:** [Express](https://expressjs.com/)
- **Base de Datos:** [MongoDB Atlas](https://www.mongodb.com/atlas) + [Mongoose](https://mongoosejs.com/)
- **Seguridad:** `bcryptjs`, `jsonwebtoken`, `cors`, `helmet`
- **Configuración:** `dotenv`

---

## 🚀 Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/LautaroLeall/DurazBer-Back.git
cd DurazBer-Back

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear archivo .env basado en .env.example
cp .env.example .env

# 4. Iniciar servidor de desarrollo
npm run dev

# 5. Iniciar servidor de producción
npm start
```

---

## 📄 Variables de Entorno

Crear un archivo `.env` en la raíz de `backend` con la siguiente configuración:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster0.mongodb.net/durazber?retryWrites=true&w=majority
JWT_SECRET=tu_clave_secreta_super_segura
FRONTEND_URL=http://localhost:5173
```

---

## 📄 Licencia

Desarrollado con dedicación por **Lautaro Leal Del Prete**. Todos los derechos reservados.
