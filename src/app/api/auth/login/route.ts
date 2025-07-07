import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('🔐 Login attempt for:', email);

    const supabase = createClient(
      'https://ubjujxtvlubxowsphvuk.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4'
    );

    // First, try to sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.log('❌ Supabase auth failed, trying legacy user lookup:', authError.message);
      
      // Fallback to manual user lookup for legacy users
      const { data: user, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          password,
          name,
          role_id,
          is_active
        `)
        .eq('email', email.toLowerCase())
        .single();

      console.log('🔍 User lookup result:', { user: user ? 'found' : 'not found', error: userError?.message });

      if (userError || !user) {
        console.log('❌ User not found or error:', userError?.message);
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      if (!user.is_active) {
        console.log('❌ User account is deactivated');
        return NextResponse.json(
          { success: false, error: 'Account is deactivated' },
          { status: 401 }
        );
      }

      // Check password - handle both hashed and plain text passwords
      let passwordMatch = false;
      if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
        // Hashed password
        passwordMatch = await bcrypt.compare(password, user.password);
      } else {
        // Plain text password (for testing)
        passwordMatch = user.password === password;
      }
      
      if (!passwordMatch) {
        console.log('❌ Password mismatch');
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Get role information
      let role = 'user';
      if (user.role_id) {
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('name')
          .eq('id', user.role_id)
          .single();
        
        if (!roleError && roleData) {
          role = roleData.name;
        }
      }

      console.log('✅ Legacy user authenticated successfully');

      // Generate JWT token for legacy users
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: role
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: role,
        isActive: user.is_active
      };

      return NextResponse.json({
        success: true,
        user: userResponse,
        token,
        message: 'Login successful'
      });
    }

    // Supabase auth successful
    if (authData.user) {
      console.log('✅ Supabase auth successful');
      
      // Get additional user data from our users table
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          is_active,
          role_id
        `)
        .eq('email', authData.user.email)
        .single();

      let role = null;
      if (userData?.role_id) {
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('id, name, description')
          .eq('id', userData.role_id)
          .single();
        
        if (!roleError && roleData) {
          role = roleData;
        }
      }

      const userResponse = {
        id: userData?.id || authData.user.id,  // Use database user ID if available
        email: authData.user.email,
        name: userData?.name || authData.user.user_metadata?.name || '',
        role: role || { id: null, name: 'USER', description: 'Default user role' },
        isActive: userData?.is_active !== false
      };

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: userData?.id || authData.user.id,  // Use database user ID if available
          email: authData.user.email,
          role: role?.name || 'USER'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      return NextResponse.json({
        success: true,
        user: userResponse,
        token,
        message: 'Login successful'
      });
    }

    console.log('❌ Authentication failed - no user data');
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 401 }
    );
  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 