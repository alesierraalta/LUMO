/**
 * Custom Supabase Client - No Dependencies on @supabase/supabase-js
 * 
 * This implementation uses direct HTTP calls to Supabase APIs to completely
 * avoid the problematic @supabase/realtime-js dependency that's causing
 * deployment failures in Choreo.
 */

interface User {
  id: string;
  email: string;
  user_metadata?: any;
  app_metadata?: any;
  aud: string;
  created_at: string;
  updated_at: string;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: User;
}

interface AuthResponse {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: any;
}

interface QueryBuilder {
  select: (columns?: string) => QueryBuilder;
  eq: (column: string, value: any) => QueryBuilder;
  neq: (column: string, value: any) => QueryBuilder;
  gt: (column: string, value: any) => QueryBuilder;
  gte: (column: string, value: any) => QueryBuilder;
  lt: (column: string, value: any) => QueryBuilder;
  lte: (column: string, value: any) => QueryBuilder;
  like: (column: string, pattern: string) => QueryBuilder;
  ilike: (column: string, pattern: string) => QueryBuilder;
  in: (column: string, values: any[]) => QueryBuilder;
  is: (column: string, value: any) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  single: () => Promise<{ data: any; error: any }>;
  then: (callback: (result: { data: any; error: any }) => any) => Promise<any>;
}

interface DatabaseResponse {
  data: any;
  error: any;
}

class CustomSupabaseClient {
  private supabaseUrl: string;
  private supabaseKey: string;
  private session: Session | null = null;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    
    // Try to load session from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const storedSession = localStorage.getItem('supabase.auth.token');
        if (storedSession) {
          this.session = JSON.parse(storedSession);
        }
      } catch (error) {
        console.warn('Failed to load stored session:', error);
      }
    }
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'apikey': this.supabaseKey,
    };

    if (includeAuth && this.session?.access_token) {
      headers['Authorization'] = `Bearer ${this.session.access_token}`;
    }

    return headers;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.supabaseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    return response;
  }

  private saveSession(session: Session | null) {
    this.session = session;
    
    if (typeof window !== 'undefined') {
      try {
        if (session) {
          localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        } else {
          localStorage.removeItem('supabase.auth.token');
        }
      } catch (error) {
        console.warn('Failed to save session:', error);
      }
    }
  }

  // Auth methods
  auth = {
    signInWithPassword: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
      try {
        const response = await this.makeRequest('/auth/v1/token?grant_type=password', {
          method: 'POST',
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            data: { user: null, session: null },
            error: data,
          };
        }

        const session: Session = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
          expires_at: data.expires_at,
          token_type: data.token_type,
          user: data.user,
        };

        this.saveSession(session);

        return {
          data: { user: data.user, session },
          error: null,
        };
      } catch (error) {
        return {
          data: { user: null, session: null },
          error: { message: 'Network error', details: error },
        };
      }
    },

    signOut: async (): Promise<{ error: any }> => {
      try {
        if (this.session?.access_token) {
          await this.makeRequest('/auth/v1/logout', {
            method: 'POST',
          });
        }

        this.saveSession(null);
        return { error: null };
      } catch (error) {
        this.saveSession(null); // Clear session anyway
        return { error };
      }
    },

    signUp: async (credentials: { email: string; password: string; options?: any }): Promise<AuthResponse> => {
      try {
        const response = await this.makeRequest('/auth/v1/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            data: credentials.options?.data || {},
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            data: { user: null, session: null },
            error: data,
          };
        }

        const session: Session | null = data.session ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          expires_at: data.session.expires_at,
          token_type: data.session.token_type,
          user: data.user,
        } : null;

        if (session) {
          this.saveSession(session);
        }

        return {
          data: { user: data.user, session },
          error: null,
        };
      } catch (error) {
        return {
          data: { user: null, session: null },
          error: { message: 'Network error', details: error },
        };
      }
    },

    getSession: async (): Promise<{ data: { session: Session | null }; error: any }> => {
      try {
        if (!this.session) {
          return {
            data: { session: null },
            error: null,
          };
        }

        // Check if token is expired
        if (this.session.expires_at && Date.now() / 1000 > this.session.expires_at) {
          // Try to refresh token
          const refreshResult = await this.refreshToken();
          if (refreshResult.error) {
            this.saveSession(null);
            return {
              data: { session: null },
              error: refreshResult.error,
            };
          }
        }

        return {
          data: { session: this.session },
          error: null,
        };
      } catch (error) {
        return {
          data: { session: null },
          error,
        };
      }
    },

    getUser: async (): Promise<{ data: { user: User | null }; error: any }> => {
      try {
        const sessionResult = await this.auth.getSession();
        if (sessionResult.error || !sessionResult.data.session) {
          return {
            data: { user: null },
            error: sessionResult.error,
          };
        }

        const response = await this.makeRequest('/auth/v1/user');
        const data = await response.json();

        if (!response.ok) {
          return {
            data: { user: null },
            error: data,
          };
        }

        return {
          data: { user: data },
          error: null,
        };
      } catch (error) {
        return {
          data: { user: null },
          error,
        };
      }
    },

    onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
      // Simple implementation - just call callback with current session
      setTimeout(() => {
        callback('INITIAL_SESSION', this.session);
      }, 0);

      // Return subscription object
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              // No-op for this simple implementation
            },
          },
        },
      };
    },
  };

  private async refreshToken(): Promise<{ data: Session | null; error: any }> {
    try {
      if (!this.session?.refresh_token) {
        return { data: null, error: { message: 'No refresh token available' } };
      }

      const response = await this.makeRequest('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        body: JSON.stringify({
          refresh_token: this.session.refresh_token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data };
      }

      const newSession: Session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        expires_at: data.expires_at,
        token_type: data.token_type,
        user: data.user,
      };

      this.saveSession(newSession);
      return { data: newSession, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Database methods
  from(table: string) {
    return new CustomQueryBuilder(this, table);
  }
}

class CustomQueryBuilder implements QueryBuilder {
  private client: CustomSupabaseClient;
  private table: string;
  private selectColumns = '*';
  private filters: string[] = [];
  private orderBy: string[] = [];
  private limitCount?: number;
  private isSingle = false;

  constructor(client: CustomSupabaseClient, table: string) {
    this.client = client;
    this.table = table;
  }

  select(columns = '*'): QueryBuilder {
    this.selectColumns = columns;
    return this;
  }

  eq(column: string, value: any): QueryBuilder {
    this.filters.push(`${column}=eq.${encodeURIComponent(value)}`);
    return this;
  }

  neq(column: string, value: any): QueryBuilder {
    this.filters.push(`${column}=neq.${encodeURIComponent(value)}`);
    return this;
  }

  gt(column: string, value: any): QueryBuilder {
    this.filters.push(`${column}=gt.${encodeURIComponent(value)}`);
    return this;
  }

  gte(column: string, value: any): QueryBuilder {
    this.filters.push(`${column}=gte.${encodeURIComponent(value)}`);
    return this;
  }

  lt(column: string, value: any): QueryBuilder {
    this.filters.push(`${column}=lt.${encodeURIComponent(value)}`);
    return this;
  }

  lte(column: string, value: any): QueryBuilder {
    this.filters.push(`${column}=lte.${encodeURIComponent(value)}`);
    return this;
  }

  like(column: string, pattern: string): QueryBuilder {
    this.filters.push(`${column}=like.${encodeURIComponent(pattern)}`);
    return this;
  }

  ilike(column: string, pattern: string): QueryBuilder {
    this.filters.push(`${column}=ilike.${encodeURIComponent(pattern)}`);
    return this;
  }

  in(column: string, values: any[]): QueryBuilder {
    const valueList = values.map(v => encodeURIComponent(v)).join(',');
    this.filters.push(`${column}=in.(${valueList})`);
    return this;
  }

  is(column: string, value: any): QueryBuilder {
    this.filters.push(`${column}=is.${value === null ? 'null' : encodeURIComponent(value)}`);
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}): QueryBuilder {
    const direction = options.ascending === false ? 'desc' : 'asc';
    this.orderBy.push(`${column}.${direction}`);
    return this;
  }

  limit(count: number): QueryBuilder {
    this.limitCount = count;
    return this;
  }

  single(): Promise<{ data: any; error: any }> {
    this.isSingle = true;
    return this.execute();
  }

  then(callback: (result: { data: any; error: any }) => any): Promise<any> {
    return this.execute().then(callback);
  }

  private async execute(): Promise<{ data: any; error: any }> {
    try {
      let url = `/rest/v1/${this.table}?select=${encodeURIComponent(this.selectColumns)}`;
      
      // Add filters
      if (this.filters.length > 0) {
        url += '&' + this.filters.join('&');
      }

      // Add ordering
      if (this.orderBy.length > 0) {
        url += `&order=${this.orderBy.join(',')}`;
      }

      // Add limit
      if (this.limitCount !== undefined) {
        url += `&limit=${this.limitCount}`;
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'apikey': (this.client as any).supabaseKey,
      };

      if ((this.client as any).session?.access_token) {
        headers['Authorization'] = `Bearer ${(this.client as any).session.access_token}`;
      }

      if (this.isSingle) {
        headers['Accept'] = 'application/vnd.pgrst.object+json';
      }

      const response = await fetch(`${(this.client as any).supabaseUrl}${url}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.text();
        return {
          data: null,
          error: { message: `HTTP ${response.status}: ${errorData}`, status: response.status },
        };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: 'Network error', details: error },
      };
    }
  }
}

// Singleton instance
let customSupabaseClient: CustomSupabaseClient | null = null;

export function getCustomSupabaseClient(): CustomSupabaseClient {
  if (!customSupabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    customSupabaseClient = new CustomSupabaseClient(supabaseUrl, supabaseAnonKey);
  }

  return customSupabaseClient;
}

// Reset singleton (useful for testing)
export function resetCustomSupabaseClient() {
  customSupabaseClient = null;
}

export { CustomSupabaseClient }; 