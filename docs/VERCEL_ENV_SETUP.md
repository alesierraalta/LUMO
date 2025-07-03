# Configuración de Variables de Entorno en Vercel

## Variables para PRODUCCIÓN (Vercel)

Agrega estas variables en Vercel Dashboard → Settings → Environment Variables:

```bash
# Base de Datos de PRODUCCIÓN
NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4

# Configuración de Aplicación
FORCE_SUPABASE=true
NODE_ENV=production
APP_NAME=LUMO Inventory Management
APP_VERSION=2.0.0

# Autenticación (IMPORTANTE: Cambia este secret)
NEXTAUTH_SECRET=tu-clave-secreta-super-segura-para-produccion-2024
NEXTAUTH_URL=https://lumo-alesierraaltas-projects.vercel.app
```

## Variables para DESARROLLO (Local)

En tu archivo `.env.local` (local):

```bash
# Base de Datos de DESARROLLO
NEXT_PUBLIC_SUPABASE_URL=https://ndprriqyhddjoixrlqnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDg0MDAsImV4cCI6MjA2NTY4NDQwMH0.4rzi6UFGnN6ien_706ETHjBylZMK6jt0vjRvvnJ1J-8

# Configuración de Aplicación
FORCE_SUPABASE=true
NODE_ENV=development
APP_NAME=LUMO Inventory Management
APP_VERSION=2.0.0

# Autenticación
NEXTAUTH_SECRET=tu-clave-secreta-para-desarrollo
NEXTAUTH_URL=http://localhost:3000
```

## Pasos para Configurar:

### 1. En Vercel Dashboard:
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto "lumo"
3. Ve a Settings → Environment Variables
4. Agrega cada variable una por una
5. Asegúrate de seleccionar "Production" para el environment

### 2. En tu entorno local:
1. Crea/actualiza tu archivo `.env.local`
2. Usa las variables de DESARROLLO
3. Nunca subas este archivo al repositorio

### 3. Redeploy después de configurar:
```bash
vercel --prod
```

## Verificación:
- **Local:** Conecta a base de datos DEV
- **Vercel:** Conecta a base de datos PROD
- **Datos separados:** No hay riesgo de mezclar datos 