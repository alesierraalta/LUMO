import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase-server';
import type { User } from '@supabase/supabase-js';

export const getServerSession = async (): Promise<User | null> => {
  try {
    const cookieStore = await cookies();
    
    // Check for Supabase session cookies
    const accessToken = cookieStore.get('sb-access-token')?.value ||
                       cookieStore.get('supabase-auth-token')?.value;
    
    if (!accessToken) return null;

    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    return error ? null : user;
  } catch {
    return null;
  }
}; 