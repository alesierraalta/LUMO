#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function checkUserStructure() {
  console.log('🔍 VERIFICANDO ESTRUCTURA DEL USUARIO');
  console.log('====================================');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Verificar usuario sin incluir relaciones
    console.log('\n1️⃣ USUARIO SIN RELACIONES:');
    const userPlain = await prisma.user.findUnique({
      where: { email: 'alesierraalta@gmail.com' }
    });
    console.log(JSON.stringify(userPlain, null, 2));
    
    // 2. Verificar usuario con relación de rol
    console.log('\n2️⃣ USUARIO CON RELACIÓN DE ROL:');
    const userWithRole = await prisma.user.findUnique({
      where: { email: 'alesierraalta@gmail.com' },
      include: { role: true }
    });
    console.log(JSON.stringify(userWithRole, null, 2));
    
    // 3. Análisis
    console.log('\n🎯 ANÁLISIS:');
    console.log('============');
    
    if (userPlain?.role) {
      console.log(`✅ Usuario tiene campo 'role' como string: ${userPlain.role}`);
    } else {
      console.log(`❌ Usuario NO tiene campo 'role' como string`);
    }
    
    if (userPlain?.roleId) {
      console.log(`✅ Usuario tiene 'roleId': ${userPlain.roleId}`);
    } else {
      console.log(`❌ Usuario NO tiene 'roleId'`);
    }
    
    if (userWithRole?.role?.name) {
      console.log(`✅ Usuario tiene relación 'role.name': ${userWithRole.role.name}`);
    } else {
      console.log(`❌ Usuario NO tiene relación 'role.name'`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserStructure(); 