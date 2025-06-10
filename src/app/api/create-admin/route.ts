import { NextResponse } from 'next/server';

async function createAdminUser() {
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
  
  // Step 1: Get ADMIN role ID
  console.log('🔍 Getting ADMIN role...');
  const { data: adminRole, error: roleError } = await supabase
    .from('roles')
    .select('*')
    .eq('name', 'ADMIN')
    .single();
  
  if (!adminRole) {
    return NextResponse.json({
      success: false,
      error: 'ADMIN role not found in database. Execute the SQL migration script first.'
    });
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
        role: 'ADMIN',
        note: 'Password unchanged: admin123'
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
}

export async function POST() {
  try {
    return await createAdminUser();
  } catch (error: any) {
    console.error('❌ Setup admin error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}

export async function GET() {
  try {
    return await createAdminUser();
  } catch (error: any) {
    console.error('❌ Setup admin error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
} 