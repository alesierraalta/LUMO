# 🔑 Guía de Acceso ROOT - LUMO Choreo

## 🚨 **PROBLEMA RESUELTO: Acceso ROOT en Choreo**

Esta guía explica cómo obtener acceso ROOT completo en tu despliegue de LUMO en Choreo cuando experimentas errores 401.

---

## 🆘 **Solución Rápida para Error 401**

Si estás experimentando errores 401 en Choreo como usuario ROOT, usa estas soluciones:

### **Método 1: Página de Login ROOT (Recomendado)**

1. **Ve a la página especial ROOT login:**
   ```
   https://tu-dominio-choreo.com/root-login
   ```

2. **Haz clic en "🚀 Login como ROOT"**
   - Las credenciales están pre-configuradas
   - El sistema verificará/creará tu usuario ROOT automáticamente
   - Te redirigirá al dashboard con acceso completo

### **Método 2: API Root Access (Para desarrolladores)**

```bash
# POST request al endpoint ROOT
curl -X POST https://tu-dominio-choreo.com/api/auth/root-access \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alesierraalta@gmail.com",
    "password": "admin123"
  }'
```

---

## 🔧 **¿Qué hace el sistema ROOT?**

### **Verificación Automática**
- ✅ **Verifica** si el usuario ROOT existe en Supabase
- ✅ **Crea** el usuario ROOT si no existe
- ✅ **Asegura** que tenga rol ADMIN con todos los permisos
- ✅ **Establece** la sesión de autenticación correctamente
- ✅ **Activa** el usuario si estaba desactivado

### **Configuración Completa**
```javascript
// Usuario ROOT creado automáticamente:
{
  email: "alesierraalta@gmail.com",
  password: "admin123",
  name: "Alejandro Sierra (ROOT)",
  role: "ADMIN",
  permissions: "ALL" // Acceso completo al sistema
}
```

---

## 🚀 **Pasos Detallados de Uso**

### **Paso 1: Acceder a la Página ROOT**
```
https://[tu-app].choreoapis.dev/root-login
```

### **Paso 2: Usar el Login Automático**
- La página muestra las credenciales ROOT
- Simplemente haz clic en "🚀 Login como ROOT"
- **No necesitas escribir nada** - está automatizado

### **Paso 3: Verificación Exitosa**
- Verás un mensaje: "✅ Login ROOT exitoso! Redirigiendo..."
- Serás redirigido automáticamente a `/dashboard`
- Tendrás acceso completo a todas las funciones

---

## 🔍 **Diagnóstico de Problemas**

### **Error: "Este endpoint solo funciona en Choreo"**
- **Causa:** Estás intentando usar ROOT access en desarrollo local
- **Solución:** Solo funciona en producción (Choreo)

### **Error: "Credenciales ROOT incorrectas"**
- **Causa:** Problema con las credenciales hardcodeadas
- **Solución:** Contacta al desarrollador - problema del código

### **Error: "Error configurando rol ADMIN"**
- **Causa:** Problema con la base de datos Supabase
- **Solución:** Revisa las variables de entorno de Supabase

### **Error: "Error creando usuario ROOT"**
- **Causa:** Problema de permisos en Supabase
- **Solución:** Verifica que `SUPABASE_KEY` tenga permisos de escritura

---

## ⚙️ **Variables de Entorno Requeridas**

Para que el sistema ROOT funcione, asegúrate de tener configuradas:

```bash
# En tu Choreo Dashboard
SUPABASE_URL=https://[tu-proyecto].supabase.co
SUPABASE_KEY=eyJhbGci... # Tu Supabase anon key
CHOREO_DEPLOYMENT=true
NODE_ENV=production
JWT_SECRET=[tu-jwt-secret-seguro]
```

---

## 🛡️ **Seguridad**

### **Protecciones Implementadas**
- ✅ **Solo Choreo:** Endpoint bloqueado en desarrollo
- ✅ **Credenciales fijas:** Email y password específicos de ROOT
- ✅ **HTTPS Only:** Cookies seguras en producción
- ✅ **Rol verificado:** Solo asigna rol ADMIN al usuario ROOT

### **Acceso ROOT Limitado**
- 🔒 **Solo tú:** Email hardcodeado en el código
- 🔒 **Solo Choreo:** No funciona en desarrollo local
- 🔒 **Password conocido:** Para emergencias administrativas

---

## 📝 **Logs de Debugging**

Si hay problemas, revisa los logs de Choreo para:

```
🔧 [ROOT-ACCESS] Iniciando verificación de acceso ROOT...
🔍 [ROOT-ACCESS] Verificando usuario ROOT en Supabase...
✅ [ROOT-ACCESS] Usuario ROOT encontrado
✅ [ROOT-ACCESS] Autenticación exitosa - Rol: ADMIN
```

**O si necesita crear el usuario:**
```
❌ [ROOT-ACCESS] Usuario ROOT no encontrado, creándolo...
✅ [ROOT-ACCESS] Rol ADMIN creado
✅ [ROOT-ACCESS] Usuario ROOT creado exitosamente
```

---

## 🎯 **Acceso Post-Login**

Después del login ROOT exitoso tendrás acceso a:

- 📊 **Dashboard** - Vista completa del sistema
- 📦 **Inventario** - Gestión completa de productos
- 👥 **Usuarios** - Crear/editar usuarios y roles
- ⚙️ **Configuración** - Ajustes del sistema
- 📈 **Reportes** - Todos los reportes disponibles
- 🔧 **Administración** - Funciones administrativas

---

## 📞 **Soporte**

Si el sistema ROOT no funciona:

1. **Verifica las variables de entorno** en Choreo
2. **Revisa los logs** de la aplicación en Choreo  
3. **Usa la página /root-login** como primera opción
4. **Reporta el problema** con los logs específicos

---

**✅ Sistema ROOT - LISTO PARA USAR**
**🚀 Tu acceso completo en Choreo está garantizado** 