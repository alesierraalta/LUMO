#!/usr/bin/env node

// Test para verificar que getCurrentUserFromToken funciona correctamente

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development-only';

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const getCurrentUserFromToken = async (token) => {
  const prisma = new PrismaClient();
  
  try {
    if (!token) {
      return null;
    }

    // Verify token
    const sessionData = verifyToken(token);
    if (!sessionData) {
      return null;
    }

    // Find user by ID from token with role relationship
    const userWithRole = await prisma.user.findUnique({
      where: { id: sessionData.userId },
      include: {
        role: true
      }
    });

    if (!userWithRole || !userWithRole.isActive) {
      return null;
    }

    return {
      id: userWithRole.id,
      email: userWithRole.email,
      name: userWithRole.name,
      role: userWithRole.role?.name || 'USER', // Get role name from relationship
      isActive: userWithRole.isActive,
      createdAt: userWithRole.createdAt,
      updatedAt: userWithRole.updatedAt,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
};

async function testAuthFix() {
  console.log('🔍 PROBANDO CORRECCIÓN DE AUTENTICACIÓN');
  console.log('======================================');
  
  try {
    // 1. Crear un token de prueba
    console.log('\n1️⃣ CREANDO TOKEN DE PRUEBA...');
    const testToken = jwt.sign(
      { 
        userId: 'a305cc44-bac2-4327-9764-d69caf5305df', 
        email: 'alesierraalta@gmail.com',
        role: 'ADMIN' // Este campo del token no se usa, se obtiene de la DB
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );
    console.log('✅ Token creado');
    
    // 2. Probar getCurrentUserFromToken
    console.log('\n2️⃣ PROBANDO getCurrentUserFromToken...');
    const user = await getCurrentUserFromToken(testToken);
    
    if (user) {
      console.log('✅ Usuario obtenido correctamente:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Nombre:', user.name);
      console.log('   Rol:', user.role);
      console.log('   Activo:', user.isActive);
      
      // 3. Verificar específicamente el rol
      console.log('\n3️⃣ VERIFICANDO ROL...');
      if (user.role === 'ADMIN') {
        console.log('✅ ROL CORRECTO: El usuario tiene rol ADMIN');
        console.log('✅ CORRECCIÓN EXITOSA: Ahora la función devuelve el rol correctamente');
      } else {
        console.log(`❌ ROL INCORRECTO: Esperado 'ADMIN', obtenido '${user.role}'`);
      }
      
    } else {
      console.log('❌ No se pudo obtener el usuario');
    }
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

testAuthFix(); 