# syntax=docker/dockerfile:1

# Stage 1: Install dependencies and build
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar package.json y package-lock.json primero
COPY package.json package-lock.json ./

# Copiar el directorio prisma antes de instalar dependencias
COPY prisma ./prisma/

# Instalar todas las dependencias, incluyendo las de desarrollo necesarias para compilar
RUN npm ci

# Copiar el archivo de configuración de PostCSS
COPY postcss.config.mjs ./

# Copiar todos los archivos del proyecto
COPY . .

# Mover @tailwindcss/postcss de devDependencies a dependencies para que esté disponible en producción
RUN npm install --save @tailwindcss/postcss tailwindcss

# Construir la aplicación
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Instalar solo dependencias de producción
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copiar archivos necesarios para la ejecución
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
CMD ["npm", "start"] 