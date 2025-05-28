// Script para inicializar roles básicos en SQLite
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta a la base de datos SQLite
const dbPath = path.join(__dirname, '../../prisma/dev.db');
console.log(`Conectando a base de datos en: ${dbPath}`);

// Obtener fecha actual en formato ISO
const now = new Date().toISOString();

// Conectar a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
    process.exit(1);
  }
  console.log('Conectado a la base de datos SQLite.');
});

// Iniciar transacción
db.serialize(() => {
  db.run('BEGIN TRANSACTION');

  // Verificar si ya existe el rol admin
  db.get('SELECT id FROM roles WHERE name = "admin"', (err, row) => {
    if (err) {
      // Si la tabla no existe, esto es normal
      if (err.message.includes('no such table')) {
        console.log('La tabla roles no existe, se creará automáticamente con Prisma.');
      } else {
        console.error('Error al buscar rol admin:', err.message);
      }
    } else if (!row) {
      console.log('El rol admin no existe, se creará con Prisma.');
    } else {
      console.log('El rol admin ya existe con ID:', row.id);
    }
  });

  // Verificar si ya existe el rol viewer
  db.get('SELECT id FROM roles WHERE name = "viewer"', (err, row) => {
    if (err) {
      console.error('Error al buscar rol viewer:', err.message);
      db.run('ROLLBACK');
      process.exit(1);
    }
    
    // Si no existe, crearlo
    if (!row) {
      const viewerId = `clid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      db.run(
        'INSERT INTO roles (id, name, description) VALUES (?, ?, ?)',
        [viewerId, 'viewer', 'Acceso de solo lectura a la aplicación'],
        (err) => {
          if (err) {
            console.error('Error al crear rol viewer:', err.message);
            db.run('ROLLBACK');
            process.exit(1);
          }
          console.log('Rol viewer creado correctamente.');
        }
      );
    } else {
      console.log('El rol viewer ya existe.');
    }
  });

  // Confirmar transacción
  db.run('COMMIT', (err) => {
    if (err) {
      console.error('Error al confirmar transacción:', err.message);
      db.run('ROLLBACK');
    } else {
      console.log('Operación completada.');
    }
    
    // Cerrar conexión
    db.close((err) => {
      if (err) {
        console.error('Error al cerrar conexión:', err.message);
      } else {
        console.log('Conexión cerrada.');
      }
    });
  });
}); 