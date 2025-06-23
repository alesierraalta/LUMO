import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
// JWT token generation removed - using Supabase only
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [ROOT-ACCESS] Iniciando verificación de acceso ROOT...');
    
    // Solo permitir en producción Choreo
    const isChoreo = process.env.CHOREO_DEPLOYMENT === 'true' || !!process.env.SUPABASE_URL;
    if (!isChoreo) {
      return NextResponse.json({ 
        success: false, 
        error: 'Este endpoint solo funciona en Choreo' 
      }, { status: 403 });
    }

    const { email, password } = await request.json();
    
    // Verificar credenciales ROOT específicas
    if (email !== 'alesierraalta@gmail.com' || password !== 'admin123') {
      console.log('❌ [ROOT-ACCESS] Credenciales incorrectas');
      return NextResponse.json({ 
        success: false, 
        error: 'Credenciales ROOT incorrectas' 
      }, { status: 401 });
    }

    console.log('🔍 [ROOT-ACCESS] Verificando usuario ROOT en Supabase...');
    
    // Buscar usuario ROOT
    const rootUser = await db.user.findUnique({
      where: { email: 'alesierraalta@gmail.com' }
    });

    if (!rootUser) {
      console.log('❌ [ROOT-ACCESS] Usuario ROOT no encontrado, creándolo...');
      
      // Crear usuario ROOT si no existe
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      // Primero asegurar que existe rol ADMIN
      let adminRole;
      try {
        adminRole = await db.role.findUnique({ where: { name: 'ADMIN' } });
        if (!adminRole) {
          adminRole = await db.role.create({
            data: {
              name: 'ADMIN',
              description: 'Administrador ROOT con acceso completo',
              isSystem: true,
              isActive: true
            }
          });
          console.log('✅ [ROOT-ACCESS] Rol ADMIN creado');
        }
      } catch (roleError) {
        console.error('❌ [ROOT-ACCESS] Error con rol ADMIN:', roleError);
        return NextResponse.json({ 
          success: false, 
          error: 'Error configurando rol ADMIN' 
        }, { status: 500 });
      }

      // Crear usuario ROOT
      try {
        const newRootUser = await db.user.create({
          data: {
            email: 'alesierraalta@gmail.com',
            name: 'Alejandro Sierra (ROOT)',
            password: hashedPassword,
            roleId: adminRole.id,
            isActive: true
          }
        });
        console.log('✅ [ROOT-ACCESS] Usuario ROOT creado exitosamente');
        
        // Return success without JWT tokens - use Supabase authentication
        const response = NextResponse.json({
          success: true,
          message: 'Usuario ROOT creado - use Supabase login',
          user: {
            id: newRootUser.id,
            email: newRootUser.email,
            name: newRootUser.name,
            role: 'ADMIN'
          },
          note: 'Use /api/auth/supabase-login for authentication'
        });

        return response;
        
      } catch (createError) {
        console.error('❌ [ROOT-ACCESS] Error creando usuario ROOT:', createError);
        return NextResponse.json({ 
          success: false, 
          error: 'Error creando usuario ROOT' 
        }, { status: 500 });
      }
    }

    console.log('✅ [ROOT-ACCESS] Usuario ROOT encontrado');
    
    // Verificar password del usuario existente
    const isPasswordValid = await bcrypt.compare(password, rootUser.password);
    if (!isPasswordValid) {
      console.log('❌ [ROOT-ACCESS] Password inválido para usuario ROOT');
      return NextResponse.json({ 
        success: false, 
        error: 'Password incorrecto' 
      }, { status: 401 });
    }

    // Verificar que el usuario esté activo
    if (!rootUser.isActive) {
      console.log('🔧 [ROOT-ACCESS] Activando usuario ROOT...');
      await db.user.update({
        where: { id: rootUser.id },
        data: { isActive: true }
      });
    }

    // Obtener información del rol
    let roleName = 'ADMIN';
    if (typeof rootUser.role === 'string') {
      roleName = rootUser.role;
    } else if (rootUser.role && typeof rootUser.role === 'object' && rootUser.role.name) {
      roleName = rootUser.role.name;
    }

    console.log(`✅ [ROOT-ACCESS] Autenticación exitosa - Rol: ${roleName}`);
    
    // Return success without JWT tokens - use Supabase authentication
    const response = NextResponse.json({
      success: true,
      message: 'Acceso ROOT verificado - use Supabase login',
      user: {
        id: rootUser.id,
        email: rootUser.email,
        name: rootUser.name,
        role: roleName
      },
      note: 'Use /api/auth/supabase-login for authentication'
    });

    return response;

  } catch (error) {
    console.error('❌ [ROOT-ACCESS] Error general:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 