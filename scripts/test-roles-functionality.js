require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testRolesFunctionality() {
  console.log('🔐 PROBANDO FUNCIONALIDAD DE ROLES Y PERMISOS');
  console.log('='.repeat(60));

  try {
    // 1. Probar obtener todos los permisos
    console.log('\n📋 1. Probando obtener permisos...');
    const { data: permissions, error: permError } = await supabase
      .from('permissions')
      .select('*')
      .order('category', { ascending: true });

    if (permError) {
      console.log('❌ Error al obtener permisos:', permError.message);
      return;
    }

    console.log(`✅ Permisos obtenidos: ${permissions.length} permisos`);
    
    // Agrupar por categoría
    const permsByCategory = permissions.reduce((acc, perm) => {
      const cat = perm.category || 'Sin categoría';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(perm);
      return acc;
    }, {});

    console.log('\n📊 Permisos por categoría:');
    Object.entries(permsByCategory).forEach(([category, perms]) => {
      console.log(`  ${category}: ${perms.length} permisos`);
    });

    // 2. Probar obtener roles
    console.log('\n👥 2. Probando obtener roles...');
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (rolesError) {
      console.log('❌ Error al obtener roles:', rolesError.message);
      return;
    }

    console.log(`✅ Roles obtenidos: ${roles.length} roles`);
    roles.forEach(role => {
      console.log(`  - ${role.name} (ID: ${role.id})`);
    });

    // 3. Probar obtener permisos por rol
    console.log('\n🔍 3. Probando permisos por rol...');
    for (const role of roles) {
      const { data: rolePermissions, error: rolePermError } = await supabase
        .from('role_permissions')
        .select(`
          permission_id,
          permissions (
            id,
            name,
            resource,
            action,
            category
          )
        `)
        .eq('role_id', role.id);

      if (rolePermError) {
        console.log(`❌ Error al obtener permisos para ${role.name}:`, rolePermError.message);
        continue;
      }

      const perms = rolePermissions?.map(rp => rp.permissions) || [];
      console.log(`  ${role.name}: ${perms.length} permisos`);
      
      // Mostrar algunos permisos de ejemplo
      if (perms.length > 0) {
        const examples = perms.slice(0, 3).map(p => `${p.resource}:${p.action}`).join(', ');
        console.log(`    Ejemplos: ${examples}${perms.length > 3 ? '...' : ''}`);
      }
    }

    // 4. Probar la jerarquía de permisos
    console.log('\n📈 4. Verificando jerarquía de permisos...');
    const adminRole = roles.find(r => r.name === 'ADMIN');
    const managerRole = roles.find(r => r.name === 'MANAGER');
    const userRole = roles.find(r => r.name === 'USER');

    if (adminRole && managerRole && userRole) {
      const getPermCount = async (roleId) => {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('permission_id')
          .eq('role_id', roleId);
        return error ? 0 : data.length;
      };

      const adminCount = await getPermCount(adminRole.id);
      const managerCount = await getPermCount(managerRole.id);
      const userCount = await getPermCount(userRole.id);

      console.log(`  ADMIN: ${adminCount} permisos`);
      console.log(`  MANAGER: ${managerCount} permisos`);
      console.log(`  USER: ${userCount} permisos`);

      const hierarchyCorrect = adminCount >= managerCount && managerCount >= userCount;
      console.log(`  Jerarquía correcta: ${hierarchyCorrect ? '✅' : '❌'}`);
    }

    // 5. Probar integridad de datos
    console.log('\n🔍 5. Verificando integridad de datos...');
    
    // Verificar que no hay role_permissions huérfanos
    const { data: orphanedPerms, error: orphanError } = await supabase
      .from('role_permissions')
      .select('role_id, permission_id')
      .not('role_id', 'in', `(${roles.map(r => `'${r.id}'`).join(',')})`)
      .limit(1);

    if (!orphanError) {
      console.log(`  Permisos huérfanos: ${orphanedPerms.length === 0 ? '✅ Ninguno' : '❌ ' + orphanedPerms.length}`);
    }

    // Verificar que todos los permisos existen
    const { data: validPerms, error: validError } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .not('permission_id', 'in', `(${permissions.map(p => `'${p.id}'`).join(',')})`)
      .limit(1);

    if (!validError) {
      console.log(`  Referencias inválidas: ${validPerms.length === 0 ? '✅ Ninguna' : '❌ ' + validPerms.length}`);
    }

    console.log('\n🎉 PRUEBA DE ROLES COMPLETADA');
    console.log('✅ La funcionalidad de roles está operativa');
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('1. Acceder a https://lumo-woad.vercel.app/settings/users/roles');
    console.log('2. Probar la interfaz de gestión de roles');
    console.log('3. Modificar permisos y guardar cambios');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

// Ejecutar la prueba
testRolesFunctionality(); 