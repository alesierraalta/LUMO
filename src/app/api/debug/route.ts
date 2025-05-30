// Endpoint para diagnóstico del entorno y base de datos
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  
  if (key !== 'debug-choreo-2025') {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid debug key' },
      { status: 401 }
    );
  }
  
  try {
    const prisma = new PrismaClient();
    
    // Recopilar información del entorno
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      HOSTNAME: process.env.HOSTNAME,
      DATABASE_URL: process.env.DATABASE_URL ? '***' : 'undefined', // Ocultar la URL real por seguridad
      HAS_JWT_SECRET: !!process.env.JWT_SECRET,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      cwd: process.cwd(),
      pathSep: path.sep,
      platform: process.platform,
      nodeVersion: process.version
    };
    
    // Verificar existencia de archivos
    const standaloneServerExists = fs.existsSync(path.join(process.cwd(), '.next/standalone/server.js'));
    const nextConfigExists = fs.existsSync(path.join(process.cwd(), 'next.config.js'));
    const choreoServerExists = fs.existsSync(path.join(process.cwd(), 'choreo-server.js'));
    const ensureAdminExists = fs.existsSync(path.join(process.cwd(), 'scripts/ensure-admin.js'));
    
    // Verificar estado de la base de datos
    const dbStatus: {
      connected: boolean;
      usersCount: number;
      rolesCount: number;
      permissionsCount: number;
      adminUser: any | null;
    } = {
      connected: false,
      usersCount: 0,
      rolesCount: 0,
      permissionsCount: 0,
      adminUser: null
    };
    
    try {
      // Verificar conexión a la base de datos
      await prisma.$connect();
      dbStatus.connected = true;
      
      // Contar registros básicos
      dbStatus.usersCount = await prisma.user.count();
      dbStatus.rolesCount = await prisma.role.count();
      dbStatus.permissionsCount = await prisma.permission.count();
      
      // Buscar usuario administrador
      const adminUser = await prisma.user.findUnique({
        where: { email: 'alesierraalta@gmail.com' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          isEmailVerified: true,
          role: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      dbStatus.adminUser = adminUser;
      
    } catch (dbError: any) {
      dbStatus.connected = false;
      return NextResponse.json({
        success: false,
        envInfo,
        filesInfo: {
          standaloneServerExists,
          nextConfigExists,
          choreoServerExists,
          ensureAdminExists
        },
        dbError: {
          message: dbError.message,
          code: dbError.code,
          meta: dbError.meta
        }
      });
    } finally {
      await prisma.$disconnect();
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      envInfo,
      filesInfo: {
        standaloneServerExists,
        nextConfigExists,
        choreoServerExists,
        ensureAdminExists
      },
      dbStatus
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Error running diagnostics',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 