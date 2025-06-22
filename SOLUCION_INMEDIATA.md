# 🔧 SOLUCIÓN INMEDIATA - Problema de Permisos Root en Choreo

## ❌ PROBLEMA IDENTIFICADO
Tu usuario root `alesierraalta@gmail.com` no puede acceder a la configuración de usuarios en Choreo porque **el email no está confirmado en Supabase Auth**.

## ✅ DIAGNÓSTICO COMPLETADO
- **Base de datos**: ✅ Usuario existe correctamente con rol ADMIN
- **Permisos**: ✅ Rol ADMIN configurado correctamente
- **Problema**: ❌ Email no confirmado en Supabase Auth

## 🚀 SOLUCIÓN INMEDIATA (3 opciones)

### OPCIÓN 1: Dashboard de Supabase (Recomendada)
1. Ve a https://supabase.com/dashboard
2. Inicia sesión con tu cuenta
3. Busca y selecciona tu proyecto de producción: `ubjujxtvlubxowsphvuk`
4. Ve a **Authentication** > **Users**
5. Busca tu email: `alesierraalta@gmail.com`
6. Haz clic en el usuario
7. **Confirma manualmente el email**

### OPCIÓN 2: Email de Confirmación
1. Revisa tu bandeja de entrada de `alesierraalta@gmail.com`
2. Busca emails de Supabase con links de confirmación
3. Haz clic en cualquier link de confirmación que encuentres
4. También revisa el email de reset de contraseña que acabamos de enviar

### OPCIÓN 3: OTP (Código de un solo uso)
1. Espera 60 segundos
2. Ejecuta: `./confirm-email-prod.bat`
3. Revisa tu email para el código OTP
4. Usa el código para iniciar sesión

## 📋 CREDENCIALES DE ACCESO
- **Email**: `alesierraalta@gmail.com`
- **Password**: `admin123`

## 🔍 VERIFICACIÓN
Después de confirmar el email:
1. Ve a tu aplicación en Choreo
2. Inicia sesión con las credenciales de arriba
3. Deberías ver el menú de "Configuración de Usuarios"
4. Tendrás acceso completo como administrador

## 📞 SI NECESITAS AYUDA
Si ninguna opción funciona:
1. Ejecuta `./fix-root-prod.bat` para diagnóstico adicional
2. Contacta soporte de Supabase
3. O avísame y te ayudo con pasos adicionales

## ⚡ RESUMEN RÁPIDO
**El problema NO es de código ni configuración - solo necesitas confirmar tu email en Supabase.** Una vez confirmado, todo funcionará perfectamente. 