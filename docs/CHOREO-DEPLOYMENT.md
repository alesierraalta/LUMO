# Despliegue en Choreo (WSO2)

Esta guía explica cómo desplegar el sistema LUMO en la plataforma Choreo de WSO2.

## Requisitos previos

1. **Cuenta en Choreo**: Regístrate en [Choreo Console](https://console.choreo.dev/)
2. **API Key de Choreo**: Generar una API Key desde el panel de usuario
3. **Proyecto creado en Choreo**: Crear un proyecto donde se desplegará la aplicación

## Configuración de secretos en GitHub

Configura los siguientes secretos en tu repositorio de GitHub:

```
CHOREO_API_KEY=tu_api_key_de_choreo
CHOREO_PROJECT_ID=tu_id_de_proyecto_choreo
```

## Configuración de secretos en Choreo

En la consola de Choreo, configura los siguientes secretos para tu componente:

```
DATABASE_URL=postgresql://user:password@host:port/database  # o SQLite para desarrollo
CLERK_SECRET_KEY=tu_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=tu_clerk_publishable_key
```

## Métodos de despliegue

### 1. Despliegue automático con GitHub Actions

El workflow `.github/workflows/choreo-deploy.yml` está configurado para desplegar automáticamente en Choreo cuando:

- Se hace push a la rama `main`
- Se dispara manualmente el workflow desde GitHub, seleccionando el entorno (dev, staging, prod)

### 2. Despliegue manual desde línea de comandos

```bash
# Instalar Choreo CLI
curl -fsSL https://wso2.com/choreo/install/cli | sh

# Iniciar sesión en Choreo
choreo login --api-key TU_API_KEY

# Construir la aplicación
npm ci
npm run build

# Crear el paquete para deployment
tar -czf deploy.tar.gz .next node_modules public package.json next.config.ts prisma

# Desplegar a Choreo
choreo components deploy \
  --project TU_PROYECTO_ID \
  --name lumo-inventory-dev \
  --artifact deploy.tar.gz
```

### 3. Despliegue desde la consola de Choreo

1. Inicia sesión en [Choreo Console](https://console.choreo.dev/)
2. Selecciona tu proyecto
3. Crea un nuevo componente de tipo "Web Application"
4. Selecciona GitHub como fuente
5. Conecta con tu repositorio y selecciona la rama `main`
6. Configura los parámetros de construcción y despliegue:
   - Runtime: Node.js 20
   - Build Command: `npm run build`
   - Start Command: `npm run start`
   - Port: 3000
7. Configura los secretos y variables de entorno
8. Inicia el despliegue

## Estructura de archivos para Choreo

- `choreo.yaml`: Configuración principal para Choreo
- `.github/workflows/choreo-deploy.yml`: Workflow de GitHub Actions para despliegue automatizado

## Verificación del despliegue

Una vez desplegada la aplicación, puedes verificar su estado:

1. **Endpoint de salud**: Accede a `/api/health` para verificar el estado del sistema
2. **Logs en tiempo real**: Disponibles en la consola de Choreo
3. **Métricas de rendimiento**: Disponibles en la sección de monitoreo de Choreo

## Configuración de dominio personalizado

Para configurar un dominio personalizado en Choreo:

1. Ve a la sección "Networking" de tu componente
2. Selecciona "Custom Domains"
3. Sigue las instrucciones para configurar tu dominio
4. Configura los registros DNS necesarios

## Solución de problemas comunes

### Error al conectar a la base de datos

Verifica que la URL de la base de datos sea accesible desde la red de Choreo. Si usas una base de datos externa, asegúrate de que:

1. La base de datos permita conexiones desde los rangos IP de Choreo
2. Los puertos necesarios estén abiertos
3. Las credenciales sean correctas

### Errores en el despliegue

Si encuentras errores durante el despliegue:

1. Verifica los logs en la consola de Choreo
2. Asegúrate de que todos los secretos estén configurados correctamente
3. Verifica que el archivo `choreo.yaml` esté correctamente formateado
4. Prueba la aplicación localmente antes de desplegarla

### Rendimiento lento

Si la aplicación tiene un rendimiento lento:

1. Ajusta los recursos (CPU, memoria) en `choreo.yaml`
2. Aumenta el número de réplicas
3. Verifica las métricas de rendimiento para identificar cuellos de botella 