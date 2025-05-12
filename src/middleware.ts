import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Definir cuáles rutas son públicas
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)", 
  "/sign-up(.*)",
  "/api/(.*)auth(.*)"
]);

// Aplicar middleware con verificación personalizada
export default clerkMiddleware(async (auth, req) => {
  // Si el usuario intenta acceder a la ruta raíz, permitir
  // (la página raíz manejará la redirección basada en la autenticación)
  if (req.nextUrl.pathname === '/') {
    return NextResponse.next();
  }
  
  // Si es una ruta pública, permitir
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // Si no está autenticado, redirigir a sign-in
  try {
    await auth.protect();
    return NextResponse.next();
  } catch (error) {
    const signInUrl = new URL('/sign-in', req.url);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}; 