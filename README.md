# 🚀 LUMO Inventory Management System

A modern, scalable inventory management system built with **Next.js 15**, **TypeScript**, **Tailwind CSS 4**, and **Prisma ORM**. Features robust authentication, real-time updates, and production-ready deployment capabilities.

## ✨ Features

### Core Functionality
- 📦 **Product Management** - Add, edit, delete, and track products with variants
- 🏷️ **Category Management** - Organize products with hierarchical categories
- 📊 **Inventory Tracking** - Real-time stock levels and automated alerts
- 📈 **Analytics & Reports** - Comprehensive business insights and analytics
- 👥 **User Management** - Role-based access control with Clerk authentication
- 🔄 **Real-time Updates** - Live inventory updates across all connected clients

### Technical Features
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS 4
- 🔒 **Secure Authentication** - Powered by Clerk with multi-factor support
- 🛡️ **Error Boundaries** - Comprehensive error handling and recovery
- 🌐 **API Routes** - RESTful API with proper validation and error handling
- 🐳 **Docker Ready** - Complete containerization with Docker Compose
- 📱 **Mobile Responsive** - Optimized for all device sizes
- ♿ **Accessibility** - WCAG 2.1 compliant with proper ARIA labels

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 15, React 18, TypeScript |
| **Styling** | Tailwind CSS 4, HeadlessUI |
| **Authentication** | Clerk |
| **Database** | PostgreSQL, Prisma ORM |
| **Deployment** | Docker, Choreo Platform |
| **Icons** | Lucide React |
| **State Management** | React Context + Hooks |

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm
- **PostgreSQL** 15+
- **Docker** (optional, recommended)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/lumo-inventory.git
   cd lumo-inventory
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Set up environment variables**
   ```bash
   cp env.template .env.local
   ```
   
   Edit `.env.local` with your actual values:
   ```env
   # Authentication (required)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
   CLERK_SECRET_KEY=sk_test_your-secret-here
   
   # Database (required)
   DATABASE_URL=postgresql://user:password@localhost:5432/lumo_inventory
   
   # Optional: Skip auth for development
   NEXT_PUBLIC_SKIP_CLERK_AUTH=true
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate deploy
   npm run db:init
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🐳 Docker Deployment

### Quick Start with Docker Compose

1. **Using the production stack**
   ```bash
   # Copy environment template
   cp env.template .env
   
   # Edit .env with your production values
   nano .env
   
   # Start the application
   docker-compose up -d
   ```

2. **Development with hot reload**
   ```bash
   # Start development stack
   docker-compose --profile dev up -d
   ```

3. **Full stack with monitoring**
   ```bash
   # Start with monitoring and admin tools
   docker-compose --profile full --profile admin --profile monitoring up -d
   ```

### Available Services

| Service | Port | Description |
|---------|------|-------------|
| **lumo-app** | 8080 | Main application |
| **database** | 5432 | PostgreSQL database |
| **lumo-dev** | 3000 | Development server (dev profile) |
| **adminer** | 8081 | Database admin (admin profile) |
| **grafana** | 3001 | Monitoring dashboard (monitoring profile) |
| **prometheus** | 9090 | Metrics collection (monitoring profile) |

## ⚙️ Configuration

### Environment Variables

The system uses a comprehensive configuration system. See [`env.template`](./env.template) for all available options.

#### Required Variables

```env
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
```

#### Development Variables

```env
NODE_ENV=development
NEXT_PUBLIC_SKIP_CLERK_AUTH=true
DEV_PORT=3000
```

#### Production Variables

```env
NODE_ENV=production
PORT=8080
HOSTNAME=0.0.0.0
```

### CSS Manifest Resolution

The system includes an advanced CSS manifest validation system that automatically resolves Next.js build issues:

```bash
# Validate and fix CSS manifests
npm run fix-manifests

# Validate build before deployment
npm run validate-build
```

## 📊 Health Monitoring

### Health Check Endpoints

- **`/api/health`** - Comprehensive system health check
- **`/health`** - Simple health check
- **`/api/manifest-status`** - CSS manifest validation status

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2025-05-28T13:46:42.610Z",
  "version": "0.1.0",
  "checks": {
    "server": true,
    "database": true,
    "manifests": true,
    "css": true,
    "authentication": true
  },
  "details": {
    "uptime": 123.45,
    "memory": {...},
    "manifests": {...},
    "css": {...},
    "environment": "production"
  }
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Testing Database

```bash
# Reset test database
npm run db:reset

# Seed test data
npm run db:seed
```

## 🚀 Deployment

### Choreo Platform (Recommended)

1. **Build the Docker image**
   ```bash
   docker build -t lumo-inventory .
   ```

2. **Deploy to Choreo**
   - Push your code to GitHub
   - Connect repository to Choreo
   - Set environment variables in Choreo dashboard
   - Deploy using the provided Dockerfile

### Manual Docker Deployment

1. **Build production image**
   ```bash
   docker build -t lumo-inventory:latest .
   ```

2. **Run with environment variables**
   ```bash
   docker run -d \
     --name lumo-inventory \
     -p 8080:8080 \
     -e DATABASE_URL="postgresql://..." \
     -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..." \
     -e CLERK_SECRET_KEY="sk_live_..." \
     lumo-inventory:latest
   ```

### Production Checklist

- [ ] Set production environment variables
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure backup strategy
- [ ] Set up monitoring and logging
- [ ] Test health check endpoints
- [ ] Verify CSS manifest validation
- [ ] Configure rate limiting
- [ ] Set up error tracking (Sentry)

## 🛡️ Security

### Authentication

- **Clerk Integration** - Production-ready authentication
- **Multi-factor Authentication** - SMS and authenticator app support
- **Session Management** - Secure JWT-based sessions
- **Role-based Access** - Granular permission system

### Security Headers

The application automatically sets secure headers:

```javascript
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

### Environment Security

- All sensitive data in environment variables
- Secrets never committed to repository
- Production vs development configurations
- Secure cookie settings in production

## 🔧 Development

### Project Structure

```
lumo-inventory/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard pages
│   │   └── layout.tsx         # Root layout
│   ├── components/            # Reusable components
│   │   ├── ui/               # UI components
│   │   ├── forms/            # Form components
│   │   └── charts/           # Chart components
│   ├── lib/                  # Utilities and configurations
│   ├── hooks/                # Custom React hooks
│   └── types/                # TypeScript definitions
├── scripts/                  # Build and deployment scripts
│   └── manifest-validator.js # CSS manifest validation
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
├── docker-compose.yml        # Container orchestration
├── Dockerfile               # Production container
└── next.config.ts           # Next.js configuration
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:init` | Initialize database |
| `npm run db:migrate` | Run database migrations |
| `npm run fix-manifests` | Fix CSS manifest issues |
| `npm run validate-build` | Validate build artifacts |

### CSS Manifest System

The application includes an advanced CSS manifest validation system that prevents common Next.js deployment issues:

#### Manifest Validator Features

- **Automatic Detection** - Finds and repairs missing `entryCSSFiles`
- **Fallback CSS Generation** - Creates fallback stylesheets
- **Build Integration** - Runs automatically during build process
- **Health Monitoring** - Monitors manifest integrity in production

#### Manual Validation

```bash
# Run manifest validation
node scripts/manifest-validator.js

# Check specific manifests
node scripts/manifest-validator.js --check-only

# Repair corrupted manifests
node scripts/manifest-validator.js --repair
```

### Error Handling

The application includes comprehensive error boundaries:

```typescript
import { ErrorBoundary } from '@/components/ui/error-boundary';

// Page-level error boundary
<PageErrorBoundary>
  <YourPage />
</PageErrorBoundary>

// Component-level error boundary
<ComponentErrorBoundary>
  <YourComponent />
</ComponentErrorBoundary>

// Critical error boundary (full application)
<CriticalErrorBoundary>
  <App />
</CriticalErrorBoundary>
```

### Loading States

Comprehensive loading components for better UX:

```typescript
import { 
  LoadingSpinner, 
  PageLoading, 
  TableSkeleton,
  ProductsLoading 
} from '@/components/ui/loading-states';

// Simple spinner
<LoadingSpinner size="md" />

// Page loading with icon
<ProductsLoading />

// Table skeleton
<TableSkeleton rows={5} columns={4} />
```

## 📈 Performance

### Optimization Features

- **Image Optimization** - Next.js built-in image optimization
- **Code Splitting** - Automatic code splitting with dynamic imports
- **CSS Optimization** - PostCSS optimization with Tailwind CSS
- **Caching Strategy** - Redis-based caching for API responses
- **Database Optimization** - Prisma query optimization

### Performance Monitoring

- **Health Checks** - Built-in health monitoring
- **Response Time Tracking** - Automatic response time monitoring
- **Memory Usage** - Real-time memory usage reporting
- **Error Rate Monitoring** - Comprehensive error tracking

## 🐛 Troubleshooting

### Common Issues

#### CSS Manifest Errors

**Problem**: `TypeError: Cannot read properties of undefined (reading 'entryCSSFiles')`

**Solution**:
```bash
# Fix CSS manifests
npm run fix-manifests

# Or run manually
node scripts/manifest-validator.js
```

#### Database Connection Issues

**Problem**: `Error: Can't reach database server`

**Solution**:
```bash
# Check database status
docker-compose ps database

# Restart database
docker-compose restart database

# Check database logs
docker-compose logs database
```

#### Authentication Issues

**Problem**: `Clerk authentication failed`

**Solution**:
1. Verify environment variables:
   ```bash
   echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   echo $CLERK_SECRET_KEY
   ```
2. Check Clerk dashboard for key validity
3. For development, set `NEXT_PUBLIC_SKIP_CLERK_AUTH=true`

#### Build Failures

**Problem**: Next.js build fails with CSS errors

**Solution**:
```bash
# Clean build cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm ci

# Run manifest validation
npm run prebuild

# Rebuild
npm run build
```

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
NODE_ENV=development
```

### Health Check Issues

If health checks fail:

1. **Check the health endpoint**:
   ```bash
   curl http://localhost:8080/api/health
   ```

2. **Verify all services**:
   ```bash
   docker-compose ps
   ```

3. **Check application logs**:
   ```bash
   docker-compose logs lumo-app
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Use semantic commit messages
- Update documentation for new features
- Ensure all health checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Clerk](https://clerk.dev/) - Authentication platform
- [Prisma](https://prisma.io/) - Next-generation ORM
- [Lucide](https://lucide.dev/) - Beautiful icon library

## 📞 Support

- **Documentation**: [Wiki](../../wiki)
- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)
- **Email**: support@lumo-inventory.com

---

**Made with ❤️ by the LUMO Team**

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

## Deployment

### Production Deployment

To run the application in production mode:

```bash
npm run build
npm start
```

### CSS Issues in Next.js 15.3.1

This application includes fixes for the CSS loading issues in Next.js 15.3.1. If you encounter any CSS-related errors or "entryCSSFiles" errors, you can use the following specialized start scripts:

- `npm start` - Standard start with CSS fix integration
- `npm run start:runtime-fix` - Use runtime patching for CSS fixes
- `npm run start:css-fix` - Use dedicated CSS fix server
- `npm run start:choreo` - Optimized for Choreo deployment with CSS fixes

### Troubleshooting CSS Issues

If you still encounter CSS loading issues, try these steps:

1. Ensure the `.next/static/css` directory exists
2. Check that manifest files contain the `entryCSSFiles` property
3. Try running with the most aggressive fix: `npm run start:safe`

### Debugging

For detailed debugging output, use:

```bash
npm run start:debug
```

#   L U M O 
 
 