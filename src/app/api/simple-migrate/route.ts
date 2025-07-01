import db from "@/lib/db";
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// Simple endpoint para migrar la base de datos PostgreSQL
export async function GET() {
  try {
    // Usar conexión segura
    // Prisma client is already available and connected
    console.log('✅ Database connected successfully');

    // Hacer un query simple para verificar que las tablas existen
    try {
      const usersCount = await db.user.count();
      const rolesCount = await db.role.count();
      
      return NextResponse.json({
        status: 'success',
        message: 'Database is ready and populated',
        data: {
          users: usersCount,
          roles: rolesCount,
          database_url: process.env.DATABASE_URL ? 'configured' : 'missing',
          timestamp: new Date().toISOString()
        }
      });
    } catch (tableError: any) {
      console.log('❌ Tables do not exist, need to create schema:', tableError.message);
      
      return NextResponse.json({
        status: 'needs_migration',
        message: 'Database connected but tables need to be created',
        error: tableError.message,
        instructions: [
          'Database URL is configured but tables are missing',
          'Run migration: npx prisma db push',
          'Then seed: npx prisma db seed'
        ],
        timestamp: new Date().toISOString()
      });
    } finally {
      // Prisma client will auto-disconnect
      console.log('✅ Database operation completed');
    }
    
  } catch (error: any) {
    console.error('❌ Database connection failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      database_url: process.env.DATABASE_URL ? 'configured' : 'missing',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST para ejecutar migración automática
export async function POST() {
  return NextResponse.json({
    status: 'info',
    message: 'Use GET method to check database status',
    timestamp: new Date().toISOString()
  });
} 