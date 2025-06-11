import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { generateToken } from '@/lib/auth-simple';
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
        
        // Generar token para el nuevo usuario
        const token = generateToken({
          userId: newRootUser.id,
          email: newRootUser.email,
          role: 'ADMIN'
        });

        const response = NextResponse.json({
          success: true,
          message: 'Usuario ROOT creado y autenticado',
          user: {
            id: newRootUser.id,
            email: newRootUser.email,
            name: newRootUser.name,
            role: 'ADMIN'
          }
        });

        // Establecer cookie de autenticación
        response.cookies.set('auth-token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60, // 7 días
          path: '/'
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
    
    // Generar token
    const token = generateToken({
      userId: rootUser.id,
      email: rootUser.email,
      role: roleName
    });

    const response = NextResponse.json({
      success: true,
      message: 'Acceso ROOT verificado exitosamente',
      user: {
        id: rootUser.id,
        email: rootUser.email,
        name: rootUser.name,
        role: roleName
      }
    });

    // Establecer cookie de autenticación
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/'
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