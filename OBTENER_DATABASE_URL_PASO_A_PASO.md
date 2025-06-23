# 🔑 OBTENER DATABASE_URL - GUÍA PASO A PASO

## 🎯 **UBICACIÓN EXACTA:**

### **Paso 1: Inicia Sesión**
- URL: https://supabase.com/dashboard
- Usa tu cuenta de GitHub o email

### **Paso 2: Selecciona Proyecto LUMO**
- Busca: **LUMO** (ubjujxtvlubxowsphvuk)
- Click en el proyecto

### **Paso 3: Ve a Settings**
- En el menú lateral izquierdo
- Click en **⚙️ Settings**

### **Paso 4: Click en Database**
- En el submenu de Settings
- Click en **🗄️ Database**

### **Paso 5: Busca "Connection String"**
- Scroll hacia abajo
- Busca sección **"Connection Pooling"** o **"Connection String"**
- Busca **"URI"** o **"Connection String"**

## 📋 **LO QUE VERÁS:**

```
Connection String:
postgresql://postgres:[YOUR-PASSWORD]@db.ubjujxtvlubxowsphvuk.supabase.co:5432/postgres
```

## 🔄 **ALTERNATIVA - Si no ves la contraseña:**

### **Opción A: Generar Nueva Contraseña**
1. En la misma página Database
2. Busca **"Database Password"** 
3. Click **"Generate new password"**
4. **COPIA** la nueva contraseña
5. Úsala en la CONNECTION STRING

### **Opción B: Usar Service Role Key**
1. Ve a **Settings** → **API**
2. Busca **"service_role"** key
3. Pero **NO USES ESTA** para DATABASE_URL

## 🎯 **FORMATO FINAL:**

```
DATABASE_URL=postgresql://postgres:TU_PASSWORD_REAL@db.ubjujxtvlubxowsphvuk.supabase.co:5432/postgres
```

## ⚠️ **IMPORTANTE:**
- Reemplaza `[YOUR-PASSWORD]` con tu contraseña real
- NO uses corchetes [ ]
- NO incluyas espacios
- La URL debe ser UNA línea continua

## 📸 **SI NECESITAS AYUDA:**
- Comparte screenshot de la página Database settings
- Te ayudo a encontrar la connection string exacta 