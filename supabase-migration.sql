-- LUMO Inventory Management System - Supabase Migration
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource, action)
);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_id UUID NOT NULL REFERENCES users(id)
);

-- Create locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_items table
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(255) UNIQUE,
    barcode VARCHAR(255),
    current_stock INTEGER DEFAULT 0,
    min_level INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    max_level INTEGER,
    cost DECIMAL(10,2) DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    margin DECIMAL(10,2) DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category_id UUID REFERENCES categories(id),
    location_id UUID REFERENCES locations(id),
    created_by_id UUID NOT NULL REFERENCES users(id)
);

-- Create stock_movements table
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    cost DECIMAL(10,2),
    price DECIMAL(10,2),
    reason VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
    location_id UUID REFERENCES locations(id),
    created_by_id UUID NOT NULL REFERENCES users(id)
);

-- Create sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    total DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_id UUID NOT NULL REFERENCES users(id)
);

-- Create sale_items table
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id)
);

-- Create import_sessions table
CREATE TABLE import_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'processing',
    notes TEXT,
    total_items INTEGER DEFAULT 0,
    success_items INTEGER DEFAULT 0,
    warning_items INTEGER DEFAULT 0,
    error_items INTEGER DEFAULT 0,
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create import_session_details table
CREATE TABLE import_session_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    row_index INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    data TEXT,
    import_session_id UUID NOT NULL REFERENCES import_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
INSERT INTO roles (name, description, is_system) VALUES
('ADMIN', 'Acceso completo al sistema', true),
('MANAGER', 'Gestión operativa', true),
('USER', 'Usuario básico', true);

-- Insert permissions
INSERT INTO permissions (name, description, resource, action, category, is_system) VALUES
('Ver Dashboard', 'Acceso al panel principal', 'dashboard', 'view', 'page', true),
('Ver Inventario', 'Ver productos en inventario', 'inventory', 'view', 'page', true),
('Crear Inventario', 'Añadir nuevos productos', 'inventory', 'create', 'data', true),
('Editar Inventario', 'Modificar productos existentes', 'inventory', 'edit', 'data', true),
('Eliminar Inventario', 'Eliminar productos del inventario', 'inventory', 'delete', 'data', true),
('Ajustar Stock', 'Ajustar niveles de stock', 'inventory', 'adjust', 'data', true),
('Ver Ventas', 'Ver historial de ventas', 'sales', 'view', 'page', true),
('Crear Ventas', 'Registrar nuevas ventas', 'sales', 'create', 'data', true),
('Editar Ventas', 'Modificar ventas existentes', 'sales', 'edit', 'data', true),
('Ver Ubicaciones', 'Ver ubicaciones de inventario', 'locations', 'view', 'page', true),
('Crear Ubicaciones', 'Añadir nuevas ubicaciones', 'locations', 'create', 'data', true),
('Editar Ubicaciones', 'Modificar ubicaciones existentes', 'locations', 'edit', 'data', true),
('Ver Categorías', 'Ver categorías de productos', 'categories', 'view', 'page', true),
('Crear Categorías', 'Añadir nuevas categorías', 'categories', 'create', 'data', true),
('Editar Categorías', 'Modificar categorías existentes', 'categories', 'edit', 'data', true),
('Ver Usuarios', 'Ver lista de usuarios', 'users', 'view', 'page', true),
('Crear Usuarios', 'Añadir nuevos usuarios', 'users', 'create', 'data', true),
('Editar Usuarios', 'Modificar usuarios existentes', 'users', 'edit', 'data', true),
('Ver Permisos', 'Ver configuración de permisos', 'permissions', 'view', 'page', true),
('Editar Permisos', 'Modificar permisos de roles', 'permissions', 'edit', 'data', true),
('Ver Configuración', 'Acceso a configuración del sistema', 'settings', 'view', 'page', true),
('Editar Configuración', 'Modificar configuración del sistema', 'settings', 'edit', 'data', true),
('Ver Reportes', 'Acceso a reportes y análisis', 'reports', 'view', 'page', true);

-- Assign all permissions to ADMIN role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ADMIN';

-- Create admin user (password: admin123 - will be hashed by the application)
-- This will be created automatically by the setup script

COMMIT; 