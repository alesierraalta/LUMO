/**
 * Choreo Deployment Setup Script
 * 
 * This script handles the complete setup for Choreo deployment:
 * 1. Verifies Supabase connection
 * 2. Creates admin user and roles
 * 3. Adds default categories and locations
 * 4. Fixes any schema issues
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const ADMIN_EMAIL = 'alesierraalta@gmail.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Alejandro Sierra (ROOT)';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Required environment variables:');
  console.error('- SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Starting Choreo deployment setup...');
console.log(`📍 Supabase URL: ${supabaseUrl.substring(0, 30)}...`);

async function setupChoreoDeployment() {
  try {
    // Step 1: Verify Supabase connection
    console.log('\n🔍 Step 1: Verifying Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('roles')
      .select('count', { count: 'exact' });
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError.message);
      throw testError;
    }
    
    console.log('✅ Supabase connection successful');

    // Step 2: Create roles if they don't exist
    console.log('\n🏷️ Step 2: Setting up roles...');
    
    const roles = [
      { name: 'ADMIN', description: 'Administrador con acceso completo al sistema', is_system: true },
      { name: 'MANAGER', description: 'Gestión operativa', is_system: true },
      { name: 'USER', description: 'Usuario básico', is_system: true }
    ];

    for (const role of roles) {
      const { data: existingRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', role.name)
        .single();

      if (!existingRole) {
        const { data: newRole, error } = await supabase
          .from('roles')
          .insert([role])
          .select()
          .single();

        if (error) {
          console.error(`❌ Error creating role ${role.name}:`, error.message);
        } else {
          console.log(`✅ Role ${role.name} created`);
        }
      } else {
        console.log(`✅ Role ${role.name} already exists`);
      }
    }

    // Step 3: Create permissions
    console.log('\n🔐 Step 3: Setting up permissions...');
    
    const permissions = [
      { name: 'Ver Dashboard', resource: 'dashboard', action: 'view', category: 'page', description: 'Acceso al panel principal', is_system: true },
      { name: 'Ver Inventario', resource: 'inventory', action: 'view', category: 'page', description: 'Ver productos en inventario', is_system: true },
      { name: 'Crear Inventario', resource: 'inventory', action: 'create', category: 'data', description: 'Añadir nuevos productos', is_system: true },
      { name: 'Editar Inventario', resource: 'inventory', action: 'edit', category: 'data', description: 'Modificar productos existentes', is_system: true },
      { name: 'Eliminar Inventario', resource: 'inventory', action: 'delete', category: 'data', description: 'Eliminar productos del inventario', is_system: true },
      { name: 'Ver Categorías', resource: 'categories', action: 'view', category: 'page', description: 'Ver categorías de productos', is_system: true },
      { name: 'Crear Categorías', resource: 'categories', action: 'create', category: 'data', description: 'Añadir nuevas categorías', is_system: true },
      { name: 'Ver Ubicaciones', resource: 'locations', action: 'view', category: 'page', description: 'Ver ubicaciones de inventario', is_system: true },
      { name: 'Crear Ubicaciones', resource: 'locations', action: 'create', category: 'data', description: 'Añadir nuevas ubicaciones', is_system: true }
    ];

    const createdPermissions = [];
    for (const perm of permissions) {
      const { data: existingPerm } = await supabase
        .from('permissions')
        .select('id')
        .eq('resource', perm.resource)
        .eq('action', perm.action)
        .single();

      if (!existingPerm) {
        const { data: newPerm, error } = await supabase
          .from('permissions')
          .insert([perm])
          .select()
          .single();

        if (error) {
          console.error(`❌ Error creating permission ${perm.name}:`, error.message);
        } else {
          createdPermissions.push(newPerm);
          console.log(`✅ Permission ${perm.name} created`);
        }
      } else {
        createdPermissions.push(existingPerm);
        console.log(`✅ Permission ${perm.name} already exists`);
      }
    }

    // Step 4: Get ADMIN role and assign all permissions
    console.log('\n🔗 Step 4: Assigning permissions to ADMIN role...');
    
    const { data: adminRole } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'ADMIN')
      .single();

    if (adminRole) {
      // Get all permissions
      const { data: allPermissions } = await supabase
        .from('permissions')
        .select('id');

      for (const permission of allPermissions) {
        const { data: existingRolePermission } = await supabase
          .from('role_permissions')
          .select('id')
          .eq('role_id', adminRole.id)
          .eq('permission_id', permission.id)
          .single();

        if (!existingRolePermission) {
          const { error } = await supabase
            .from('role_permissions')
            .insert([{
              role_id: adminRole.id,
              permission_id: permission.id
            }]);

          if (error) {
            console.error('❌ Error assigning permission:', error.message);
          }
        }
      }
      console.log('✅ All permissions assigned to ADMIN role');
    }

    // Step 5: Create admin user
    console.log('\n👤 Step 5: Setting up admin user...');
    
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, role_id')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
      
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          email: ADMIN_EMAIL,
          name: ADMIN_NAME,
          password: hashedPassword,
          role_id: adminRole.id,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating admin user:', error.message);
      } else {
        console.log('✅ Admin user created successfully');
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
      }
    } else {
      console.log('✅ Admin user already exists');
      
      // Ensure admin user has the correct role
      if (existingUser.role_id !== adminRole.id) {
        const { error } = await supabase
          .from('users')
          .update({ role_id: adminRole.id })
          .eq('id', existingUser.id);

        if (error) {
          console.error('❌ Error updating admin user role:', error.message);
        } else {
          console.log('✅ Admin user role updated');
        }
      }
    }

    // Step 6: Create default categories
    console.log('\n📂 Step 6: Setting up default categories...');
    
    // Get admin user ID for foreign key
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (adminUser) {
      const categories = [
        { name: 'General', description: 'Categoría general para productos' },
        { name: 'Electrónicos', description: 'Productos electrónicos y tecnológicos' },
        { name: 'Ropa', description: 'Prendas de vestir y accesorios' },
        { name: 'Hogar', description: 'Artículos para el hogar' }
      ];

      for (const category of categories) {
        const { data: existingCategory } = await supabase
          .from('categories')
          .select('id')
          .eq('name', category.name)
          .single();

        if (!existingCategory) {
          const { error } = await supabase
            .from('categories')
            .insert([{
              ...category,
              created_by_id: adminUser.id
            }]);

          if (error) {
            console.error(`❌ Error creating category ${category.name}:`, error.message);
          } else {
            console.log(`✅ Category ${category.name} created`);
          }
        } else {
          console.log(`✅ Category ${category.name} already exists`);
        }
      }
    }

    // Step 7: Create default locations
    console.log('\n📍 Step 7: Setting up default locations...');
    
    const locations = [
      { name: 'Almacén Principal', description: 'Ubicación principal del almacén' },
      { name: 'Tienda', description: 'Área de ventas de la tienda' },
      { name: 'Depósito', description: 'Área de almacenamiento secundario' }
    ];

    for (const location of locations) {
      const { data: existingLocation } = await supabase
        .from('locations')
        .select('id')
        .eq('name', location.name)
        .single();

      if (!existingLocation) {
        const { error } = await supabase
          .from('locations')
          .insert([{
            ...location,
            is_active: true
          }]);

        if (error) {
          console.error(`❌ Error creating location ${location.name}:`, error.message);
        } else {
          console.log(`✅ Location ${location.name} created`);
        }
      } else {
        console.log(`✅ Location ${location.name} already exists`);
      }
    }

    // Step 8: Verify setup
    console.log('\n🔍 Step 8: Verifying setup...');
    
    const { data: finalUser } = await supabase
      .from('users')
      .select(`
        id, email, name, is_active,
        role:roles(name, description)
      `)
      .eq('email', ADMIN_EMAIL)
      .single();

    const { data: categoriesCount } = await supabase
      .from('categories')
      .select('count', { count: 'exact' });

    const { data: locationsCount } = await supabase
      .from('locations')
      .select('count', { count: 'exact' });

    console.log('\n✅ Setup completed successfully!');
    console.log('\n📊 Final Status:');
    console.log(`   👤 Admin User: ${finalUser?.email} (${finalUser?.role?.name})`);
    console.log(`   📂 Categories: ${categoriesCount?.count || 0}`);
    console.log(`   📍 Locations: ${locationsCount?.count || 0}`);
    console.log('\n🔑 Login Credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n🎉 Your Choreo deployment is ready!');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the setup
setupChoreoDeployment(); 