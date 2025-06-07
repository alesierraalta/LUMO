// Migración de base de datos para Choreo
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    console.log("Starting Choreo database migration...");
    
    // Check if ImportSession table exists
    let importSessionExists = false;
    try {
      await prisma.$queryRawUnsafe("SELECT 1 FROM \"ImportSession\" LIMIT 1");
      importSessionExists = true;
    } catch (error) {
      console.log("ImportSession table does not exist, will create it");
    }
    
    if (!importSessionExists) {
      // Create ImportSession table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ImportSession" (
          id TEXT PRIMARY KEY,
          filename TEXT NOT NULL,
          status TEXT NOT NULL,
          totalRows INTEGER NOT NULL DEFAULT 0,
          processedRows INTEGER NOT NULL DEFAULT 0,
          createdRows INTEGER NOT NULL DEFAULT 0,
          updatedRows INTEGER NOT NULL DEFAULT 0,
          errorRows INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "userId" TEXT,
          error TEXT
        )
      `);
      console.log("Created ImportSession table");
    }
    
    // Check if ImportSessionItem table exists
    let importSessionItemExists = false;
    try {
      await prisma.$queryRawUnsafe("SELECT 1 FROM \"ImportSessionItem\" LIMIT 1");
      importSessionItemExists = true;
    } catch (error) {
      console.log("ImportSessionItem table does not exist, will create it");
    }
    
    if (!importSessionItemExists) {
      // Create ImportSessionItem table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ImportSessionItem" (
          id TEXT PRIMARY KEY,
          "sessionId" TEXT NOT NULL,
          "rowNumber" INTEGER NOT NULL,
          status TEXT NOT NULL,
          data JSONB NOT NULL,
          error TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "ImportSessionItem_sessionId_fkey" 
          FOREIGN KEY ("sessionId") 
          REFERENCES "ImportSession"(id) 
          ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      console.log("Created ImportSessionItem table");
    }
    
    return NextResponse.json({
      success: true,
      message: "Choreo database migration completed successfully"
    });
  } catch (error) {
    console.error("Error during Choreo migration:", error);
    return NextResponse.json(
      { error: "Failed to run Choreo migration", details: String(error) },
      { status: 500 }
    );
  }
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