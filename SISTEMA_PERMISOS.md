# Sistema de Permisos Granular - LUMO

## Descripción General

Hemos implementado un sistema de permisos granular que permite a los administradores configurar exactamente qué puede ver y hacer cada tipo de usuario en el sistema LUMO.

## Características Principales

### 🔐 Control Granular de Permisos
- **Permisos por página**: Control de acceso a páginas específicas (dashboard, inventario, ventas, etc.)
- **Permisos por acción**: Control de acciones específicas (ver, crear, editar, eliminar)
- **Permisos por categoría**: Clasificación de permisos (página, función, administración)

### 👥 Gestión de Roles
- **Roles predeterminados**: ADMIN, MANAGER, USER
- **Roles personalizados**: Los administradores pueden crear roles adicionales
- **Configuración flexible**: Cada rol puede tener permisos específicos configurados

### 🛡️ Protección de Componentes
- **PermissionGuard**: Protege páginas completas basado en permisos
- **PermissionButton**: Muestra/oculta botones basado en permisos
- **usePermissions**: Hook para verificar permisos en componentes

## Estructura del Sistema

### Permisos Disponibles

#### Dashboard
- `dashboard.view` - Ver dashboard

#### Inventario
- `inventory.view` - Ver inventario
- `inventory.create` - Crear productos
- `inventory.edit` - Editar productos
- `inventory.delete` - Eliminar productos

#### Ventas
- `sales.view` - Ver ventas
- `sales.create` - Crear ventas
- `sales.edit` - Editar ventas

#### Ubicaciones
- `locations.view` - Ver ubicaciones
- `locations.create` - Crear ubicaciones
- `locations.edit` - Editar ubicaciones

#### Categorías
- `categories.view` - Ver categorías
- `categories.create` - Crear categorías
- `categories.edit` - Editar categorías

#### Usuarios (Administración)
- `users.view` - Ver usuarios
- `users.create` - Crear usuarios
- `users.edit` - Editar usuarios
- `users.delete` - Eliminar usuarios

#### Permisos (Solo Admin)
- `permissions.view` - Ver permisos
- `permissions.manage` - Gestionar permisos

#### Configuración
- `settings.view` - Ver configuración
- `settings.edit` - Editar configuración

#### Reportes
- `reports.view` - Ver reportes
- `reports.export` - Exportar reportes

### Roles Predeterminados

#### ADMIN
- **Descripción**: Administrador con acceso completo
- **Permisos**: Todos los permisos disponibles
- **Características especiales**: No puede ser eliminado, siempre tiene acceso total

#### MANAGER
- **Descripción**: Gerente con acceso a inventario y ventas
- **Permisos incluidos**:
  - Dashboard, inventario, ventas, ubicaciones, categorías
  - Crear, editar productos y ventas
  - Ver reportes y configuración básica
- **Permisos excluidos**: Gestión de usuarios y permisos

#### USER
- **Descripción**: Usuario básico con permisos limitados
- **Permisos incluidos**:
  - Ver dashboard, inventario, ventas, ubicaciones, categorías
  - Ver configuración personal
- **Permisos excluidos**: Crear, editar, eliminar, administración

## Uso del Sistema

### Para Administradores

#### Acceder a la Gestión de Permisos
1. Navegar a **Configuración** → **Usuarios** → **Gestión de Permisos**
2. Solo usuarios con rol ADMIN pueden acceder

#### Configurar Permisos de un Rol
1. Seleccionar el rol a configurar
2. Usar los switches para habilitar/deshabilitar permisos específicos
3. Los cambios se guardan automáticamente

#### Crear un Nuevo Rol
1. Hacer clic en "Crear Rol"
2. Ingresar nombre y descripción
3. Configurar permisos específicos usando los switches
4. El rol estará disponible al crear/editar usuarios

#### Asignar Roles a Usuarios
1. Ir a **Gestión de Usuarios**
2. Crear nuevo usuario o editar existente
3. Seleccionar el rol apropiado del dropdown

### Para Desarrolladores

#### Proteger una Página Completa
```jsx
import { PermissionGuard } from '@/components/auth/permission-guard';

export default function MyPage() {
  return (
    <PermissionGuard requiredPermission="inventory.view">
      <div>Contenido protegido</div>
    </PermissionGuard>
  );
}
```

#### Proteger un Botón o Componente
```jsx
import { PermissionButton } from '@/components/auth/permission-guard';

function MyComponent() {
  return (
    <PermissionButton requiredPermission="inventory.create">
      <button>Crear Producto</button>
    </PermissionButton>
  );
}
```

#### Usar el Hook de Permisos
```jsx
import { usePermissions } from '@/components/auth/permission-guard';

function MyComponent() {
  const { hasPermission, hasRole, currentUser } = usePermissions();
  
  if (hasPermission('inventory.edit')) {
    return <EditButton />;
  }
  
  return <ViewOnlyMode />;
}
```

#### Verificar Múltiples Permisos
```jsx
// Todos los permisos requeridos (AND)
<PermissionGuard requiredPermissions={['inventory.view', 'inventory.edit']}>
  <EditForm />
</PermissionGuard>

// Al menos uno requerido (OR)
<PermissionGuard anyPermissions={['inventory.view', 'sales.view']}>
  <Dashboard />
</PermissionGuard>
```

## Navegación Adaptiva

El sidebar se adapta automáticamente basado en los permisos del usuario:
- **Secciones ocultas**: Las páginas sin permisos no aparecen en el menú
- **Separadores dinámicos**: Solo se muestran si hay elementos en esa sección
- **Indicadores de rol**: El sidebar muestra el rol actual del usuario

## Almacenamiento

### Configuración Local (localStorage)
- Los roles y permisos se almacenan en `localStorage` como `lumo-roles`
- Permite configuración rápida sin base de datos compleja
- Se puede migrar fácilmente a base de datos cuando sea necesario

### Datos de Usuario
- Los usuarios mantienen una referencia al rol asignado
- La verificación de permisos es en tiempo real
- Los cambios requieren reinicio de sesión para aplicarse completamente

## Características de Seguridad

### Validación de Cliente y Servidor
- **Frontend**: Oculta elementos UI basado en permisos
- **Backend**: Validación adicional en APIs (recomendado implementar)

### Jerarquía de Roles
- **ADMIN**: Siempre tiene acceso completo, no puede ser limitado
- **Roles personalizados**: Pueden tener cualquier combinación de permisos
- **Herencia**: Los administradores tienen acceso a todo independientemente de configuración

### Protecciones
- No se puede eliminar el rol ADMIN
- No se pueden eliminar usuarios ADMIN desde la interfaz
- Verificación de permisos en múltiples niveles

## Beneficios del Sistema

### Para Administradores
- **Control total**: Deciden exactamente qué puede hacer cada usuario
- **Flexibilidad**: Pueden crear roles específicos para su organización
- **Seguridad**: Principio de menor privilegio aplicado automáticamente

### Para Usuarios
- **Interfaz limpia**: Solo ven las opciones que pueden usar
- **Sin confusión**: No hay botones o páginas inaccesibles
- **Experiencia personalizada**: La interfaz se adapta a su rol

### Para Desarrolladores
- **Fácil implementación**: Componentes simples para proteger contenido
- **Consistencia**: Misma lógica de permisos en toda la aplicación
- **Escalabilidad**: Fácil agregar nuevos permisos y funcionalidades

## Próximos Pasos

### Mejoras Recomendadas
1. **Migración a base de datos**: Mover configuración de roles de localStorage a BD
2. **API de permisos**: Implementar validación de permisos en el backend
3. **Auditoría**: Registro de cambios de permisos y accesos
4. **Permisos temporales**: Asignación de permisos con fecha de expiración
5. **Grupos de usuarios**: Gestión de permisos por grupos además de roles individuales

### Configuración Avanzada
- Implementar permisos por ubicación o sucursal
- Permisos condicionales basados en horarios
- Integración con sistemas de autenticación externos

## Uso en Producción

### Configuración Inicial
1. El administrador principal debe configurar los roles según las necesidades
2. Asignar permisos específicos a cada rol creado
3. Asignar roles apropiados a todos los usuarios
4. Probar el acceso con diferentes tipos de usuario

### Mantenimiento
- Revisar permisos periódicamente
- Actualizar roles cuando cambian las responsabilidades
- Monitorear accesos para detectar problemas de permisos

## Soporte

Para dudas sobre implementación o configuración:
1. Revisar esta documentación
2. Verificar el código en `/src/components/auth/permission-guard.tsx`
3. Consultar ejemplos en `/src/app/(main)/settings/users/roles/page.tsx` 