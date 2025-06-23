# 🔑 OBTENER DATABASE_URL DE SUPABASE

## 📍 **PASOS ESPECÍFICOS:**

### 1. **Ve a Supabase Dashboard:**
- URL: https://supabase.com/dashboard
- Proyecto: **LUMO** (ubjujxtvlubxowsphvuk)

### 2. **Navega a Database Settings:**
- Click en **Settings** (ícono de engranaje)
- Click en **Database**

### 3. **Busca Connection String:**
- Scroll hacia abajo hasta **Connection Pooling**
- O busca la sección **Connection String**
- Busca **URI** o **Connection String**

### 4. **Copia la URL Completa:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.ubjujxtvlubxowsphvuk.supabase.co:5432/postgres
```

### 5. **Reemplaza [YOUR-PASSWORD]:**
- Usa la contraseña que configuraste cuando creaste el proyecto
- O genera una nueva contraseña si no la recuerdas

## 🎯 **FORMATO FINAL:**
```
DATABASE_URL=postgresql://postgres:TU_PASSWORD_REAL@db.ubjujxtvlubxowsphvuk.supabase.co:5432/postgres
```

## ⚠️ **IMPORTANTE:**
- **NO incluyas espacios** en la URL
- **NO uses corchetes** [ ] en la contraseña
- La URL debe ser **una línea continua**

## 🔄 **DESPUÉS DE AGREGAR:**
1. **Guarda** los cambios en Choreo
2. **Redeploy** el proyecto
3. Los logs deberían mostrar: "✅ [Choreo Setup] All environment variables validated" 