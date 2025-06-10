# Variables de Entorno para Choreo

Configura estas variables en tu proyecto de Choreo:

## **Supabase Configuration**

```bash
SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4

# Next.js Public Variables  
NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4

# Environment Detection
CHOREO_DEPLOYMENT=true
NODE_ENV=production

# JWT Secret (generar uno aleatorio)
JWT_SECRET=tu_jwt_secret_super_seguro_aqui

# Compatibility (mantener por ahora)
DATABASE_URL=postgresql://placeholder
```

## **¿Cómo configurar en Choreo?**

1. Ve a tu proyecto en Choreo
2. Ve a **Settings** > **Environment Variables**  
3. Agrega cada variable una por una
4. Deploy tu aplicación

## **Local Development (.env.local)**

Para desarrollo local, mantén solo:

```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET=test_secret
NODE_ENV=development
```

La aplicación detectará automáticamente si está en Choreo y usará Supabase, o si está en local y usará SQLite. 