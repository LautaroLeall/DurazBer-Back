# DurazBer — Backend API 🍑⚡

API RESTful de alto rendimiento para **DurazBer (Berni Come Durazno)**, el sistema interactivo de seguimiento diario de duraznos, cálculo de racha botánica y analítica nutricional comparativa rodante de 3 meses.

🔗 **Producción (Render):** [https://durazber-back.onrender.com](https://durazber-back.onrender.com)  
🌐 **Aplicación Web (Vercel):** [https://duraz-ber.vercel.app](https://duraz-ber.vercel.app)

---

## 🌟 Características Principales

- **Autenticación JWT & Cookies Seguras:** Registro, inicio de sesión, actualización de perfil y cambio de contraseña con `jsonwebtoken`, `cookie-parser` y contraseñas encriptadas mediante `bcryptjs`.
- **Precisión de Zona Horaria del Cliente (`x-timezone-offset`):** Corte de día exacto a medianoche local del usuario (por defecto `UTC-3` Argentina) mediante `dateHelper.js`, evitando reinicios prematuros en servidores cloud con hora UTC.
- **Consultas O(1) de Rango en MongoDB (Cero N+1 Queries):**
  - **Cálculo de Racha (`streakHelper.js`):** Evalúa hasta 400 días consecutivos en **1 sola consulta** a MongoDB Atlas y agrupa por fecha local en memoria.
  - **Analítica Semanal y Trimestral (`analyticsController.js`):** Estadísticas de los últimos 7 días y comparativa rodante de 3 meses resueltas en una única consulta por endpoint.
- **Sincronización en Tiempo Real:** Los endpoints `POST /peaches/increment`, `POST /peaches/decrement` y `DELETE /peaches/:id` devuelven el resumen diario actualizado (`todaySummary` + `streak` + `nutrition`) en la misma respuesta para evitar dobles viajes de red.
- **Retención Rodante Automática (3 Meses):** Servicio de limpieza (`cleanupService.js`) que depura automáticamente registros antiguos para mantener la base de datos ágil y escalable.
- **Enrutamiento Dual Tolerante (`/api/*` y `/*`):** Las rutas están montadas con y sin el prefijo `/api` para garantizar compatibilidad total con cualquier configuración de entorno en producción.

---

## 🛠️ Stack Tecnológico

- **Entorno de Ejecución:** [Node.js](https://nodejs.org/) (ES Modules)
- **Framework Web:** [Express 4](https://expressjs.com/)
- **Base de Datos:** [MongoDB Atlas](https://www.mongodb.com/atlas) + [Mongoose 9](https://mongoosejs.com/)
- **Seguridad y Autenticación:** `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `cors`
- **Variables de Entorno:** `dotenv`
- **Desarrollo:** `nodemon`

---

## 📡 Endpoints Principales

| Método | Ruta                          | Descripción                                                           |
| :----- | :---------------------------- | :-------------------------------------------------------------------- |
| `GET`  | `/api/health`                 | Estado del servidor, base de datos y política de retención            |
| `POST` | `/api/auth/register`          | Registro de nuevo usuario e inicio automático de sesión               |
| `POST` | `/api/auth/login`             | Inicio de sesión y sincronización de racha actual                     |
| `GET`  | `/api/auth/profile`           | Perfil del usuario autenticado y racha al día                         |
| `PUT`  | `/api/auth/profile`           | Actualización de nombre, bio, meta diaria (`dailyGoal`) o contraseña  |
| `GET`  | `/api/peaches/today`          | Resumen del día local, progreso de meta y desglose nutricional        |
| `POST` | `/api/peaches/increment`      | Suma duraznos (`+1`, `+2`, etc.) y retorna `todaySummary` actualizado |
| `POST` | `/api/peaches/decrement`      | Resta 1 unidad del día actual y retorna `todaySummary` actualizado    |
| `GET`  | `/api/peaches/history`        | Historial paginado con filtro por mes y año local                     |
| `GET`  | `/api/analytics/weekly`       | Consumo diario y cumplimiento de meta de los últimos 7 días           |
| `GET`  | `/api/analytics/three-months` | Comparativa rodante de los últimos 3 meses (kcal, fibra, kg, Vit C)   |
| `GET`  | `/api/analytics/export`       | Exportación completa del historial en formato `.CSV`                  |

---

## 🚀 Instalación y Ejecución Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/LautaroLeall/DurazBer-Back.git
cd DurazBer-Back

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Iniciar servidor en modo desarrollo (con recarga automática)
npm run dev

# 5. Iniciar servidor en producción
npm start

# 6. (Opcional) Reiniciar colección de pruebas en base de datos
npm run reset
```

---

## ⚙️ Variables de Entorno (`.env`)

Crear un archivo `.env` en la raíz del proyecto siguiendo `.env.example`:

```env
PORT=5000
NODE_ENV=development

# URI de conexión a MongoDB Atlas
MONGO_URI=mongodb+srv://<usuario>:<password>@durazber.frzo2gd.mongodb.net/durazber?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://<usuario>:<password>@durazber.frzo2gd.mongodb.net/durazber?retryWrites=true&w=majority

# Clave secreta para firma de tokens JWT
JWT_SECRET=tu_jwt_secret_super_seguro

# Origen permitido para CORS (Frontend)
CLIENT_URL=http://localhost:5173

# Política de retención de datos rodante (Purga automática en meses)
DATA_RETENTION_MONTHS=3
```

---

## 📄 Licencia

Desarrollado por **Lautaro Leal Del Prete (LLDP)**. Todos los derechos reservados.
