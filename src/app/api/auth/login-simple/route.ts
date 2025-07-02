import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 SIMPLE LOGIN API CALLED');
    
    const body = await request.json();
    const { email, password } = body;

    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password?.length);

    // Direct database lookup only
    const supabaseUrl = 'https://ubjujxtvlubxowsphvuk.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3Bodnd1ayIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MTc5NzYzODQsImV4cCI6MjAzMzU1MjM4NH0.oUP6oOOaYjRcqLEGBBHsO7CfZPKKbJJKcAJQbFKHcWU';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📊 Querying database...');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim())
      .single();

    console.log('Database result:');
    console.log('- Has data:', !!data);
    console.log('- Error:', error?.message || 'none');
    console.log('- User email:', data?.email);
    console.log('- Has password:', !!data?.password);
    console.log('- Password starts with $2b$:', data?.password?.startsWith('$2b$'));

    if (error || !data) {
      console.log('❌ User not found');
      return NextResponse.json({ 
        success: false, 
        error: 'Usuario no encontrado',
        debug: { error: error?.message }
      }, { status: 401 });
    }

    // Test bcrypt
    console.log('🧪 Testing bcrypt...');
    console.log('Input password:', password);
    console.log('Stored hash:', data.password);
    
    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, data.password);
      console.log('Bcrypt result:', isValid);
    } catch (bcryptError) {
      console.log('Bcrypt error:', bcryptError.message);
      return NextResponse.json({ 
        success: false, 
        error: 'Error en verificación de contraseña',
        debug: { bcryptError: bcryptError.message }
      }, { status: 500 });
    }

    if (isValid) {
      console.log('✅ LOGIN SUCCESS');
      return NextResponse.json({
        success: true,
        user: {
          id: data.id,
          email: data.email,
          name: data.name,
          role: 'ADMIN'
        },
        message: 'Login exitoso (Simple)',
        debug: {
          method: 'simple-database',
          bcryptResult: isValid
        }
      });
    } else {
      console.log('❌ PASSWORD INVALID');
      return NextResponse.json({ 
        success: false, 
        error: 'Contraseña incorrecta',
        debug: { 
          bcryptResult: isValid,
          passwordLength: password.length,
          hashLength: data.password.length
        }
      }, { status: 401 });
    }

  } catch (error) {
    console.error('💥 Simple login error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno',
      debug: { error: error.message }
    }, { status: 500 });
  }
} 