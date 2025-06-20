import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server-client';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Email del usuario root que debe ser ADMIN
    const rootEmail = 'alesierraalta@gmail.com';
    
    console.log('🔧 Iniciando corrección de rol para usuario root:', rootEmail);

    // Buscar el usuario en la base de datos
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', rootEmail)
      .single();

    if (findError) {
      console.error('❌ Error buscando usuario:', findError);
      
      if (findError.code === 'PGRST116') {
        // Usuario no existe, lo creamos
        console.log('👤 Usuario no existe, creando usuario root...');
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email: rootEmail,
            name: 'Root Administrator',
            role: 'ADMIN',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creando usuario root:', createError);
          return NextResponse.json({
            success: false,
            error: 'Failed to create root user',
            details: createError.message
          }, { status: 500 });
        }

        console.log('✅ Usuario root creado exitosamente:', newUser);
        return NextResponse.json({
          success: true,
          action: 'created',
          user: newUser,
          message: 'Usuario root creado con rol ADMIN'
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to find user',
        details: findError.message
      }, { status: 500 });
    }

    // Usuario existe, verificar y actualizar rol si es necesario
    console.log('👤 Usuario encontrado:', existingUser);

    if (existingUser.role === 'ADMIN') {
      console.log('✅ Usuario ya tiene rol ADMIN');
      return NextResponse.json({
        success: true,
        action: 'no_change_needed',
        user: existingUser,
        message: 'Usuario ya tiene rol ADMIN'
      });
    }

    // Actualizar rol a ADMIN
    console.log('🔄 Actualizando rol de USER a ADMIN...');
    
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        role: 'ADMIN',
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('email', rootEmail)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error actualizando rol:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update user role',
        details: updateError.message
      }, { status: 500 });
    }

    console.log('✅ Rol actualizado exitosamente:', updatedUser);

    // Verificar la actualización
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('email', rootEmail)
      .single();

    if (verifyError) {
      console.error('⚠️ Error verificando actualización:', verifyError);
    } else {
      console.log('🔍 Verificación - Usuario actual:', verifyUser);
    }

    return NextResponse.json({
      success: true,
      action: 'updated',
      user: updatedUser,
      verification: verifyUser,
      message: 'Rol actualizado de USER a ADMIN exitosamente',
      instructions: [
        '1. Cierra sesión en la aplicación',
        '2. Vuelve a iniciar sesión',
        '3. Las opciones del sidebar deberían aparecer ahora',
        '4. Verifica en /debug-permissions que ahora apareces como ADMIN'
      ]
    });

  } catch (error) {
    console.error('💥 Error general:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// También permitir GET para verificar estado actual
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const rootEmail = 'alesierraalta@gmail.com';

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', rootEmail)
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        details: error.message
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
      needsUpdate: user.role !== 'ADMIN',
      currentRole: user.role,
      isActive: user.is_active
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 