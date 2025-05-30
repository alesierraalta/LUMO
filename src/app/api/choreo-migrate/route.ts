// Migración de base de datos para Choreo
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(JSON.stringify({
    status: 'info',
    message: 'Database migration endpoint',
    instructions: [
      'Use POST method to execute migration',
      'Send JSON: {"action": "migrate"} to run db push',
      'Send JSON: {"action": "seed"} to seed initial data'
    ],
    available_actions: ['migrate', 'seed'],
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(request: Request) {
  try {
    const { action, key } = await request.json();
    
    // Verificar clave de seguridad para operaciones sensibles
    if (key !== 'choreo-migrate-2025') {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Invalid security key',
        timestamp: new Date().toISOString()
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'migrate') {
      try {
        // Ejecutar db push para sincronizar schema
        const { execSync } = require('child_process');
        
        console.log('🔄 Starting database migration...');
        const output = execSync('npx prisma db push --skip-generate', { 
          encoding: 'utf8',
          timeout: 60000 // 60 segundos timeout
        });
        
        console.log('✅ Migration completed:', output);
        
        return new Response(JSON.stringify({
          status: 'success',
          message: 'Database migration completed successfully',
          output: output,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (migrationError: any) {
        console.error('❌ Migration failed:', migrationError);
        
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Database migration failed',
          error: migrationError.message,
          output: migrationError.stdout || '',
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (action === 'seed') {
      try {
        console.log('🌱 Starting database seeding...');
        
        // Importar los módulos necesarios
        const { PrismaClient } = require('@prisma/client');
        const bcrypt = require('bcryptjs');
        const prisma = new PrismaClient();
        
        // Crear roles básicos
        const adminRole = await prisma.role.upsert({
          where: { name: 'admin' },
          update: {},
          create: {
            name: 'admin',
            description: 'Acceso completo a todas las funcionalidades',
          },
        });
        
        // Permisos básicos para el rol admin
        const adminPermission = await prisma.permission.upsert({
          where: { name: 'admin:all' },
          update: {},
          create: {
            name: 'admin:all',
            description: 'Acceso completo de administrador',
            resource: 'admin',
            action: 'all',
          },
        });
        
        // Asignar permiso al rol admin
        await prisma.rolePermission.upsert({
          where: { 
            roleId_permissionId: {
              roleId: adminRole.id,
              permissionId: adminPermission.id,
            },
          },
          update: {},
          create: {
            roleId: adminRole.id,
            permissionId: adminPermission.id,
          },
        });
        
        // Crear usuario admin root (SIEMPRE PRESENTE)
        const rootAdminPasswordHash = await bcrypt.hash('admin123', 12);
        const rootAdminUser = await prisma.user.upsert({
          where: { email: 'alesierraalta@gmail.com' },
          update: {
            // Asegurar que siempre tenga rol de admin
            roleId: adminRole.id,
            isActive: true,
            isEmailVerified: true,
            passwordHash: rootAdminPasswordHash
          },
          create: {
            email: 'alesierraalta@gmail.com',
            passwordHash: rootAdminPasswordHash,
            firstName: 'Alejandro',
            lastName: 'Sierra',
            roleId: adminRole.id,
            isActive: true,
            isEmailVerified: true,
          },
        });
        
        await prisma.$disconnect();
        
        return new Response(JSON.stringify({
          status: 'success',
          message: 'Seeding completed successfully',
          adminUser: {
            email: rootAdminUser.email,
            firstName: rootAdminUser.firstName,
            lastName: rootAdminUser.lastName,
            role: 'admin'
          },
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (seedError: any) {
        console.error('❌ Seed error:', seedError);
        
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Database seeding failed',
          error: seedError.message,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Invalid action. Use "migrate" or "seed"',
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Invalid request format',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 