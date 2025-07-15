# LUMO Inventory Management System

## Production Build

This is the production-ready version of LUMO with all debug endpoints and test code removed.

### Core Features
- ✅ Complete CRUD operations for inventory, categories, locations
- ✅ Supabase authentication and authorization
- ✅ Role-based access control (RBAC)
- ✅ Optimized for production deployment

### API Endpoints (Production)
- `/api/auth/*` - Authentication endpoints
- `/api/inventory/*` - Inventory management
- `/api/categories/*` - Category management  
- `/api/locations/*` - Location management
- `/api/users/*` - User management
- `/api/roles/*` - Role management
- `/api/permissions/*` - Permission management
- `/api/health` - Health check

### Development Tools
All test scripts and debug utilities have been moved to `dev-tools/` directory.

### Deployment
```bash
npm run build
npm run start
```

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NODE_ENV=production`
