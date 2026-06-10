# Polla Mundialista 2026 ⚽🏆

Una aplicación web moderna, premium y responsive para organizar una polla (pronósticos de marcadores) privada del Mundial 2026 entre amigos.

Construida con **React (Vite)**, **Tailwind CSS**, y **Supabase** (Base de datos PostgreSQL, RLS y triggers de cálculo automático). La aplicación incluye un **Modo Demo Local** completamente funcional para probar y jugar de forma local e independiente antes de configurar Supabase.

---

## Características Principales

1. **Pantalla de Bienvenida**: Acceso seguro con validación de código de polla (`MUNDIAL2026`).
2. **Calendario Completo**: Los 104 partidos del Mundial 2026 importados oficialmente desde el calendario Excel.
3. **Bloqueo Inteligente**: Los pronósticos se bloquean automáticamente una vez inicia el partido.
4. **Cálculo de Puntos Automatizado**: Implementado en el backend mediante un trigger de base de datos en Supabase (o emulado localmente en modo Demo):
   - **3 puntos**: Marcador exacto acertado.
   - **1 punto**: Ganador o empate acertado (sin marcador exacto).
   - **0 puntos**: Ninguna de las anteriores.
5. **Tabla de Posiciones (Ranking)**: Ordenada por puntos, marcadores exactos, ganadores acertados y orden alfabético. Incluye descarga en CSV.
6. **Vista por Partido**: Muestra estadísticas y los pronósticos de otros participantes (protegidos y ocultos con candado hasta que el partido inicie/finalice).
7. **Panel de Administrador**: Carga de resultados reales, cambio de estados de partido (En Juego/Finalizado), reemplazo de placeholders de equipos en fases eliminatorias (ej. `W74` por `Alemania`) e inspección de predicciones de los usuarios.

---

## Estructura del Proyecto

```text
├── src/
│   ├── components/
│   │   ├── AdminDashboard.jsx    # Tab de administración
│   │   ├── CountdownToMatch.jsx  # Contador regresivo para bloqueo
│   │   ├── LeaderboardTable.jsx  # Tabla de ranking con exportador CSV
│   │   ├── LoginScreen.jsx       # Bienvenida y autenticación
│   │   ├── MatchCard.jsx         # Tarjeta de partido
│   │   ├── MatchDetail.jsx       # Modal de detalles y revelación de pronósticos
│   │   ├── PredictionForm.jsx    # Control de marcador móvil (+ / -)
│   │   └── StatusBadge.jsx       # Insignias de estados visuales
│   ├── services/
│   │   └── api.js                # Capa unificada de datos (Supabase <=> LocalStorage)
│   ├── utils/
│   │   └── points.js             # Lógica de cálculo de puntos
│   ├── App.jsx                   # Enrutador principal y estados globales
│   ├── index.css                 # Estilos Tailwind y efectos de diseño (Glassmorphism)
│   ├── main.jsx                  # Punto de entrada de React
│   ├── matches.json              # Copia local del calendario importado de Excel
│   └── supabaseClient.js         # Inicialización del cliente Supabase
├── supabase/
│   ├── schema.sql                # Estructura de tablas, RLS, vistas y triggers de Postgres
│   └── seed.sql                  # Inserciones SQL para los 104 partidos oficiales
├── package.json                  # Dependencias
├── tailwind.config.js            # Configuración estética de Tailwind
└── vite.config.js                # Configuración de Vite
```

---

## 🚀 Inicio Rápido (Local)

### 1. Clonar/Abrir el proyecto e Instalar dependencias
```bash
npm install
```

### 2. Ejecutar Servidor de Desarrollo
```bash
npm run dev
```
La consola te dará una URL local (normalmente `http://localhost:5173`). Ábrela en tu celular o navegador web.

> 💡 **Nota**: Por defecto, si no configuras las variables de entorno de Supabase, la aplicación iniciará automáticamente en **Modo Demo Local (Offline)**. Toda la información se guardará localmente en el almacenamiento del navegador (`localStorage`) y podrás crear usuarios, simular partidos y ver cómo se actualiza la tabla de posiciones inmediatamente.

---

## 🔌 Configuración de Base de Datos (Supabase Cloud)

Para conectar el proyecto a tu cuenta de Supabase en la nube:

### 1. Crear un Proyecto en Supabase
Entra a [supabase.com](https://supabase.com), crea una cuenta y un nuevo proyecto.

### 2. Ejecutar el Script de Estructura SQL
Ve a la pestaña **SQL Editor** en Supabase, crea un nuevo script (New Query) y copia el contenido del archivo [`supabase/schema.sql`](file:///Volumes/ADATA%20SC740/Antigravity/Polla%20mundialista/supabase/schema.sql). Ejecútalo (`Run`) para crear las tablas, el trigger de cálculo de puntos y habilitar la seguridad por fila (RLS).

### 3. Insertar el Calendario de Partidos
En el **SQL Editor**, crea otra consulta y ejecuta el contenido del archivo [`supabase/seed.sql`](file:///Volumes/ADATA%20SC740/Antigravity/Polla%20mundialista/supabase/seed.sql). Esto insertará los 104 partidos del calendario oficial con sus fechas, sedes y placeholders de fases avanzadas.

### 4. Configurar Variables de Entorno Locales
Crea un archivo `.env` en la raíz de tu proyecto e ingresa las credenciales de tu proyecto de Supabase:
```env
VITE_SUPABASE_URL=tu_project_url_aquí
VITE_SUPABASE_ANON_KEY=tu_anon_key_aquí
```
Reinicia el servidor de desarrollo (`npm run dev`) y verás el mensaje `🔌 Connected to Supabase Cloud Database` en la consola de herramientas de desarrollador del navegador.

---

## 🎨 Cuentas Demo y Roles

### Modo Demo Local (Offline):
Al iniciar sesión con los siguientes correos, el sistema configurará las cuentas predeterminadas:
* **Administrador**: `admin@example.com` (Cualquier contraseña)
* **Jugador Demo**: `jugador@example.com` (Cualquier contraseña)

### Modo Supabase Cloud (Autenticación Real):
* Al registrarse con cualquier correo, la aplicación creará el usuario en Supabase Auth y sincronizará su perfil.
* Para definir un usuario como administrador, edita el valor de la columna `is_admin` a `true` en la tabla `participants` de Supabase para su registro, o inicia sesión por primera vez con el correo `admin@example.com` (el trigger de la base de datos le asignará el rol de administrador automáticamente).

---

## ⚡ Despliegue en Vercel o Netlify

La aplicación está optimizada para poder subirse con un solo clic.

1. Sube tu repositorio de código a GitHub o GitLab.
2. Vincula el proyecto en Vercel o Netlify.
3. Configura las variables de entorno de producción en la plataforma de despliegue:
   - `VITE_SUPABASE_URL`: Tu URL del proyecto Supabase.
   - `VITE_SUPABASE_ANON_KEY`: Tu clave anónima de Supabase.
4. Presiona **Deploy** y ¡listo! La aplicación construirá la versión de producción e iniciará tu servidor en minutos.
