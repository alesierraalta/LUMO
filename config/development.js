// =============================================================================
// LUMO - CONFIGURACIÓN DE DESARROLLO
// =============================================================================
// Este archivo permite configurar el entorno de desarrollo de manera dinámica

const developmentConfig = {
  // Información del entorno
  environment: 'development',
  developmentMode: true,
  
  // Configuración del servidor
  server: {
    port: process.env.DEV_PORT || 3000,
    hostname: 'localhost',
    baseUrl: 'http://localhost:3000'
  },
  
  // Base de datos de desarrollo
  database: {
    // Opción 1: Base de datos actual (Neon) - USAR CON CUIDADO
    production: process.env.DATABASE_URL,
    
    // Opción 2: Base de datos local (requiere PostgreSQL local)
    local: 'postgresql://lumo_dev:lumo_dev_pass@localhost:5432/lumo_dev',
    
    // Opción 3: SQLite para desarrollo rápido
    sqlite: 'file:./dev-database.db',
    
    // Base de datos activa para desarrollo
    // Cambiar este valor para alternar entre bases de datos
    active: 'production' // 'production', 'local', 'sqlite'
  },
  
  // Autenticación
  auth: {
    jwtSecret: 'dev-jwt-secret-key-for-lumo-inventory-system-2024-local',
    sessionDuration: '7d'
  },
  
  // Características de desarrollo
  features: {
    enableDebugLogs: true,
    enableQueryLogs: true,
    enableSeedData: true,
    createTestUsers: true,
    skipEmailVerification: true,
    enableDevTools: true
  },
  
  // Usuarios de prueba (automáticamente creados)
  testUsers: [
    {
      email: 'admin@lumo.dev',
      password: 'admin123',
      role: 'admin',
      name: 'Admin Desarrollo'
    },
    {
      email: 'manager@lumo.dev', 
      password: 'manager123',
      role: 'manager',
      name: 'Manager Desarrollo'
    },
    {
      email: 'user@lumo.dev',
      password: 'user123',
      role: 'user',
      name: 'Usuario Desarrollo'
    }
  ],
  
  // Datos de ejemplo
  sampleData: {
    categories: [
      { name: 'Electrónicos', description: 'Dispositivos y tecnología' },
      { name: 'Ropa', description: 'Vestimenta y accesorios' },
      { name: 'Hogar', description: 'Artículos para el hogar' }
    ],
    locations: [
      { name: 'Almacén Principal', description: 'Almacén central' },
      { name: 'Tienda', description: 'Área de ventas' },
      { name: 'Trastienda', description: 'Almacén secundario' }
    ],
    products: [
      {
        name: 'Laptop Dell XPS 13',
        sku: 'DELL-XPS13-001',
        price: 1299.99,
        cost: 800.00,
        quantity: 15,
        category: 'Electrónicos',
        location: 'Almacén Principal'
      },
      {
        name: 'iPhone 15 Pro',
        sku: 'APPLE-IP15P-001',
        price: 999.99,
        cost: 650.00,
        quantity: 25,
        category: 'Electrónicos',
        location: 'Tienda'
      }
    ]
  }
};

module.exports = developmentConfig; 