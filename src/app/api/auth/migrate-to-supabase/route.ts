import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuración directa de Supabase para migración
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { email, password, isRootMigration } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Cliente Supabase con permisos de admin
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verificar si el usuario existe en la tabla custom users
    const { data: existingUsers, error: userQueryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)

    if (userQueryError || !existingUsers || existingUsers.length === 0) {
      return NextResponse.json(
        { error: 'User not found in system' },
        { status: 404 }
      )
    }

    const foundUser = existingUsers[0] as any

    // Solo permitir migración root para alesierraalta@gmail.com por seguridad
    if (isRootMigration && email !== 'alesierraalta@gmail.com') {
      return NextResponse.json(
        { error: 'Root migration only allowed for authorized email' },
        { status: 403 }
      )
    }

    // Verificar si ya existe en Supabase Auth
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const existingAuthUser = authUsers?.users?.find(u => u.email === email)

    if (existingAuthUser) {
      return NextResponse.json(
        { error: 'User already exists in Supabase Auth' },
        { status: 409 }
      )
    }

    // Crear usuario en Supabase Auth usando Admin API
    // Funciona igual en dev y prod ya que ambos usan Supabase
    const { data: newAuthUser, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email para migración
      user_metadata: {
        migrated_from_legacy: true,
        migration_date: new Date().toISOString(),
        original_user_id: foundUser.id,
        role_id: foundUser.roleId || foundUser.role_id,
        environment: process.env.NODE_ENV || 'development',
        supabase_project: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('ndprriqyhddjoixrlqnz') ? 'dev' : 'prod'
      }
    })

    if (signUpError) {
      console.error('Error creating user in Supabase Auth:', signUpError)
      return NextResponse.json(
        { error: `Failed to create user in Supabase Auth: ${signUpError.message}` },
        { status: 500 }
      )
    }

    // Log successful migration
    console.log(`✅ User migrated successfully:`, {
      email,
      supabase_user_id: newAuthUser.user?.id,
      original_user_id: foundUser.id,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'User successfully migrated to Supabase Auth',
      user: {
        id: newAuthUser.user?.id,
        email: newAuthUser.user?.email,
        migrated: true,
        environment: process.env.NODE_ENV,
        migration_timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Internal server error during migration' },
      { status: 500 }
    )
  }
}

// GET endpoint para verificar estado de migración
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter required' },
        { status: 400 }
      )
    }

    // Cliente Supabase con permisos de admin
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Verificar en tabla users custom
    const { data: customUsers, error: customError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)
    
    // Verificar en Supabase Auth
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const authUser = authUsers?.users?.find(u => u.email === email)

    // Información del entorno actual
    const currentEnvironment = {
      node_env: process.env.NODE_ENV || 'development',
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      is_dev: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('ndprriqyhddjoixrlqnz'),
      is_prod: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('ubjujxtvlubxowsphvuk')
    }

    const customUser = customUsers && customUsers.length > 0 ? customUsers[0] : null

    return NextResponse.json({
      email,
      exists_in_custom: !!customUser,
      exists_in_auth: !!authUser,
      migration_needed: !!customUser && !authUser,
      custom_user_id: customUser?.id,
      auth_user_id: authUser?.id,
      environment: currentEnvironment,
      message: customUser && !authUser 
        ? `Migration needed: User exists in custom system but not in Supabase Auth (${currentEnvironment.is_dev ? 'DEV' : 'PROD'} environment)`
        : authUser 
        ? `User already migrated to Supabase Auth (${currentEnvironment.is_dev ? 'DEV' : 'PROD'} environment)`
        : 'User not found in system'
    })

  } catch (error) {
    console.error('Migration check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 