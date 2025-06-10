import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🔧 Manual admin setup requested...');
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase configuration'
      });
    }

    const { createClient } = require('@supabase/supabase-js');
    const bcrypt = require('bcryptjs');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Step 1: Check if admin role exists, create if not
    console.log('🔍 Checking for ADMIN role...');
    let { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'ADMIN')
      .single();
    
    if (!adminRole) {
      console.log('🔧 Creating ADMIN role...');
      const { data: newRole, error: createRoleError } = await supabase
        .from('roles')
        .insert([{
          name: 'ADMIN',
          description: 'Acceso completo al sistema',
          is_system: true,
          is_active: true
        }])
        .select()
        .single();
      
      if (createRoleError) {
        console.error('❌ Error creating ADMIN role:', createRoleError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create ADMIN role',
          details: createRoleError.message
        });
      }
      
      adminRole = newRole;
      console.log('✅ ADMIN role created');
    } else {
      console.log('✅ ADMIN role exists');
    }
    
    // Step 2: Check if admin user exists
    console.log('🔍 Checking for admin user...');
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'alesierraalta@gmail.com')
      .single();
    
    if (existingUser) {
      // Update existing user with admin role
      console.log('🔧 Updating existing user with admin role...');
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          role_id: adminRole.id,
          is_active: true
        })
        .eq('email', 'alesierraalta@gmail.com')
        .select()
        .single();
      
      if (updateError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to update user',
          details: updateError.message
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Admin user updated successfully',
        user: {
          email: 'alesierraalta@gmail.com',
          password: 'admin123 (unchanged)',
          role: 'ADMIN'
        }
      });
    }
    
    // Step 3: Create new admin user
    console.log('🔧 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([{
        email: 'alesierraalta@gmail.com',
        password: hashedPassword,
        name: 'Alejandro Sierra (ROOT)',
        role_id: adminRole.id,
        is_active: true
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating admin user:', createError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create admin user',
        details: createError.message
      });
    }
    
    console.log('✅ Admin user created successfully');
    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        email: 'alesierraalta@gmail.com',
        password: 'admin123',
        role: 'ADMIN'
      }
    });

  } catch (error: any) {
    console.error('❌ Setup admin error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
} 