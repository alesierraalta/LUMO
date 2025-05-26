# LUMO - Next.js Inventory App

![CI Pipeline](https://github.com/alesierraalta/LUMO/workflows/CI%20Pipeline/badge.svg)
![CD Pipeline](https://github.com/alesierraalta/LUMO/workflows/CD%20Pipeline/badge.svg)
![Security Scan](https://github.com/alesierraalta/LUMO/workflows/Security%20Scan/badge.svg)

A modern inventory management application built with Next.js, Prisma, and SQLite/PostgreSQL.

## CI/CD Pipeline

This project includes a comprehensive CI/CD pipeline using GitHub Actions and Docker:

### Continuous Integration (CI)
- **Code Quality**: ESLint, TypeScript checking, Prisma schema validation
- **Security**: npm audit for vulnerabilities, dependency security checks
- **Database**: Prisma client generation, database connectivity testing
- **Build Verification**: Next.js build testing with production optimizations
- **Docker Testing**: Multi-stage container build and comprehensive health check validation
- **Performance**: Build optimization and caching strategies

### Continuous Deployment (CD)
- **Container Registry**: Automatic Docker image builds pushed to GitHub Container Registry
- **Multi-platform**: Supports both AMD64 and ARM64 architectures
- **Database Migrations**: Automated Prisma migration deployment
- **Blue-Green Deployment**: Safe deployment with automatic rollback on failure
- **Health Checks**: Comprehensive post-deployment validation including database connectivity
- **Performance Monitoring**: Response time tracking and performance validation
- **Notifications**: Detailed deployment status with success/failure reporting

### Security Workflow
- **Scheduled Scans**: Daily automated security scans at 2 AM UTC
- **Dependency Auditing**: Comprehensive npm audit with vulnerability reporting
- **Code Analysis**: Scanning for sensitive data patterns and security anti-patterns
- **Docker Security**: Container security best practices validation
- **Security Reports**: Automated security report generation and artifact storage

### Health Monitoring
The application includes an enhanced health monitoring system:

- **Database Connectivity**: Real-time database connection status
- **Authentication Service**: Clerk integration status monitoring
- **Response Time Tracking**: Performance metrics for each health check
- **Environment Information**: Version, environment, and uptime tracking
- **Graceful Degradation**: Different status levels (healthy, degraded, unhealthy)

Access the health endpoint at `/api/health` for comprehensive system status.

### Docker Support

#### Development
```bash
# Start development environment
docker-compose up --build

# Or using the provided batch file
start.bat
```

#### Production
```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up --build

# Or using the provided batch file
build-and-start.bat
```

#### Environment Variables
Create a `.env` file with the following variables:

```env
# Database Configuration (SQLite for development, PostgreSQL for production)
DATABASE_URL=file:./dev.db  # For SQLite (development)
# DATABASE_URL=postgresql://username:password@host:port/database  # For PostgreSQL (production)

# Clerk Authentication (required)
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Optional: Application Version (set automatically in CI/CD)
NEXT_PUBLIC_APP_VERSION=development
```

**Note**: The application supports both SQLite (recommended for development) and PostgreSQL (recommended for production). The database schema is automatically managed by Prisma.

## Quick Setup (Windows)

For Windows users, we've provided batch files to simplify setup and management:

1. **First-time setup**: Run `setup.bat` to install dependencies and set up the database.
2. **Start development server**: Run `start.bat` to start the Next.js development server.
3. **Production deployment**: Run `build-and-start.bat` to build and start the production server.
4. **Application management**: Run `manage.bat` for an interactive menu with all operations.

## Manual Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Neon DB)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/alesierraalta/LUMO.git
   cd LUMO
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables in `.env`

4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

5. Push the database schema:
   ```bash
   npx prisma db push
   ```

### Development

Start the development server:

```bash
npm run dev
```

Visit http://localhost:3000 to see the application.

### Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## Features

- Inventory tracking and management
- Product categorization
- Stock level monitoring
- Sales tracking
- Reporting tools
- Automated CI/CD pipeline with Docker
- Health monitoring endpoints

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Database**: PostgreSQL (Neon DB)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Authentication**: Clerk
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

## API Endpoints

### Health Monitoring
- `GET /api/health` - Comprehensive health check endpoint for monitoring
  - Returns detailed system status including:
    - Overall application health status
    - Database connectivity status
    - Authentication service configuration
    - Response time metrics
    - Application version and environment information
    - System uptime

Example response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "abc123",
  "environment": "production",
  "uptime": 3600,
  "responseTime": "15ms",
  "checks": {
    "database": "healthy",
    "auth": "configured"
  }
}
```

### Inventory Management
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Create new inventory item
- `GET /api/inventory/[id]` - Get specific inventory item
- `PUT /api/inventory/[id]` - Update inventory item
- `DELETE /api/inventory/[id]` - Delete inventory item

### Categories & Locations
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category (admin only)
- `GET /api/locations` - Get all locations
- `POST /api/locations` - Create new location (admin only)

## License

[MIT](LICENSE)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Choreo Deployment (WSO2)

LUMO está configurado para desplegarse en [Choreo](https://wso2.com/choreo/), la plataforma de integración en la nube de WSO2:

- **Despliegue automático**: Utiliza GitHub Actions con el workflow `.github/workflows/choreo-deploy.yml`
- **Configuración Choreo**: Archivo `choreo.yaml` con especificaciones de recursos y variables
- **Gestión multiambiente**: Soporte para despliegue en dev, staging y producción
- **Health Checks**: Monitoreo automático mediante endpoint `/api/health`
- **Escalado automático**: Configuración de mínimo 1 y máximo 3 réplicas según carga

Para configurar el despliegue en Choreo:

1. Configura los secretos requeridos en GitHub (CHOREO_API_KEY, CHOREO_PROJECT_ID)
2. Configura las variables de entorno en Choreo (DATABASE_URL, CLERK_SECRET_KEY, etc.)
3. Despliega manualmente o mediante push a la rama principal

Para instrucciones detalladas, consulta [docs/CHOREO-DEPLOYMENT.md](docs/CHOREO-DEPLOYMENT.md)

# Environment Variables

This application requires specific environment variables to function properly. Set these up before running the application.

## Authentication Environment Variables

For Clerk authentication, you need the following variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
- `CLERK_SECRET_KEY`: Your Clerk secret key
- `NEXT_PUBLIC_SKIP_CLERK_AUTH`: Set to 'true' to bypass authentication (development only)

### Local Development

Create a `.env.local` file with these variables:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_SKIP_CLERK_AUTH=false

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/inventory?schema=public"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Production Deployment

For production deployments, ensure these environment variables are set in your environment:

- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- NEXT_PUBLIC_SKIP_CLERK_AUTH (defaults to 'false')

When running with Docker, pass these as build arguments:

```bash
docker build \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key \
  --build-arg CLERK_SECRET_KEY=your_secret \
  -t inventory-app .
```

## Troubleshooting Authentication

If you encounter authentication errors:

1. Verify that your Clerk API keys are valid and correctly set
2. Check that ClerkProvider is properly wrapping your application
3. Set `NEXT_PUBLIC_SKIP_CLERK_AUTH=true` temporarily to bypass authentication for debugging
4. Ensure you don't have multiple versions of Clerk packages installed
#   L U M O 
 
 