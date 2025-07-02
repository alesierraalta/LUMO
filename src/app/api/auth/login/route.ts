import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 LOGIN API CALLED');
    
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        { success: false, error: 'Email y contraseña requeridos' },
        { status: 400 }
      );
    }

    console.log('📧 Login attempt for:', email.trim());

    // Use the same Service Role configuration as registration
    const supabaseUrl = 'https://ubjujxtvlubxowsphvuk.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3Bodnd1ayIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MTc5NzYzODQsImV4cCI6MjAzMzU1MjM4NH0.oUP6oOOaYjRcqLEGBBHsO7CfZPKKbJJKcAJQbFKHcWU';
    
    console.log('🔧 Creating Supabase client...');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log('✅ Supabase client created');

    // Method 1: Try Supabase Auth first
    console.log('🧪 Method 1: Trying Supabase Auth...');
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      console.log('Supabase Auth result:', {
        hasData: !!authData,
        hasUser: !!authData?.user,
        hasSession: !!authData?.session,
        error: authError?.message
      });

      if (!authError && authData.user && authData.session) {
        console.log('✅ Supabase Auth successful for:', authData.user.email);

        // Get user data from database
        const { data: userData, error: dbError } = await supabaseAdmin
          .from('users')
          .select('id, email, name, is_active, role_id')
          .eq('email', email.trim())
          .single();

        const user = {
          id: authData.user.id,
          email: authData.user.email,
          name: userData?.name || authData.user.email?.split('@')[0],
          role: email.trim() === 'alesierraalta@gmail.com' ? 'ADMIN' : 'USER',
          isActive: userData?.is_active ?? true,
        };

        console.log('🎉 Returning Supabase Auth success');
        return NextResponse.json({
          success: true,
          user,
          token: authData.session.access_token,
          message: 'Login exitoso (Supabase Auth)'
        });
      } else {
        console.log('❌ Supabase Auth failed:', authError?.message);
      }
    } catch (supabaseError) {
      console.log('❌ Supabase Auth exception:', supabaseError.message);
    }

    // Method 2: Direct database authentication (for legacy users)
    console.log('🧪 Method 2: Trying direct database auth...');
    
    console.log('📊 Querying database for user...');
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, email, name, password, is_active, role_id')
      .eq('email', email.trim())
      .single();

    console.log('Database query result:', {
      hasData: !!userData,
      hasPassword: !!userData?.password,
      isActive: userData?.is_active,
      email: userData?.email,
      error: dbError?.message
    });

    if (dbError) {
      console.error('❌ Database lookup error:', dbError.message);
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    if (!userData || !userData.is_active) {
      console.log('❌ User not found or inactive');
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    console.log('✅ Found user in database:', userData.email);
    console.log('🔑 Password hash present:', !!userData.password);
    console.log('🔑 Password hash type:', userData.password?.startsWith('$2b$') ? 'bcrypt' : 'plain');

    // Check password
    let passwordValid = false;
    
    if (userData.password) {
      // Check if it's a bcrypt hash (starts with $2b$)
      if (userData.password.startsWith('$2b$')) {
        console.log('🧪 Checking bcrypt password...');
        console.log('Input password:', password);
        console.log('Stored hash:', userData.password);
        
        try {
          passwordValid = await bcrypt.compare(password, userData.password);
          console.log('🔍 Bcrypt comparison result:', passwordValid);
        } catch (bcryptError) {
          console.error('❌ Bcrypt error:', bcryptError.message);
          passwordValid = false;
        }
      } else {
        // Plain text password comparison (for new users)
        console.log('🧪 Checking plain text password...');
        console.log('Input password:', password);
        console.log('Stored password:', userData.password);
        passwordValid = userData.password === password;
        console.log('🔍 Plain text comparison result:', passwordValid);
      }
    } else {
      console.log('❌ No password stored for user');
    }

    if (!passwordValid) {
      console.log('❌ Password validation failed for:', userData.email);
      console.log('Final decision: REJECT');
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    console.log('✅ Password validation successful for:', userData.email);

    const user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: email.trim() === 'alesierraalta@gmail.com' ? 'ADMIN' : 'USER',
      isActive: userData.is_active,
    };

    // Generate a simple JWT-like token for API access
    const token = Buffer.from(JSON.stringify({
      userId: userData.id,
      email: userData.email,
      role: user.role,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })).toString('base64');

    console.log('🎉 Returning database auth success');
    console.log('User object:', user);
    console.log('Token generated:', !!token);

    return NextResponse.json({
      success: true,
      user,
      token: token,
      message: 'Login exitoso (Database Auth)'
    });

  } catch (error) {
    console.error('💥 Login API error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 