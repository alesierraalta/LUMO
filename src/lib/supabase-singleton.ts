import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

/**
 * Obtiene una instancia singleton del cliente de Supabase
 * Esto previene múltiples instancias de GoTrueClient
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    console.log('🔧 Creating new Supabase client instance');
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'lumo-supabase-auth',
        flowType: 'pkce'
      },
      global: {
        headers: {
          'X-Client-Info': 'lumo-inventory-system'
        }
      }
    });
  }
  
  return supabaseInstance;
}

/**
 * Resetea la instancia singleton (útil para testing o reinicios)
 */
export function resetSupabaseClient(): void {
  console.log('🔄 Resetting Supabase client instance');
  supabaseInstance = null;
}

/**
 * Verifica si hay una instancia activa
 */
export function hasSupabaseInstance(): boolean {
  return supabaseInstance !== null;
} 