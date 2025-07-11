/**
 * Service-side Supabase Client using Service Role Key
 * This client bypasses RLS and is used for admin operations
 */

interface ServiceClientConfig {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

interface QueryResult {
  data: any;
  error: any;
}

class ServiceSupabaseClient {
  private supabaseUrl: string;
  private supabaseServiceRoleKey: string;

  constructor(config: ServiceClientConfig) {
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseServiceRoleKey = config.supabaseServiceRoleKey;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'apikey': this.supabaseServiceRoleKey,
      'Authorization': `Bearer ${this.supabaseServiceRoleKey}`,
    };
  }

  from(table: string) {
    return new ServiceQueryBuilder(this.supabaseUrl, this.getHeaders(), table);
  }

  // Auth admin methods
  auth = {
    admin: {
      createUser: async (params: { email: string; password: string; user_metadata?: any }): Promise<QueryResult> => {
        try {
          const response = await fetch(`${this.supabaseUrl}/auth/v1/admin/users`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
              email: params.email,
              password: params.password,
              email_confirm: true,
              user_metadata: params.user_metadata || {},
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            return { data: null, error: data };
          }

          return { data, error: null };
        } catch (error) {
          return { data: null, error: { message: 'Network error', details: error } };
        }
      },

      updateUserById: async (userId: string, params: { user_metadata?: any }): Promise<QueryResult> => {
        try {
          const response = await fetch(`${this.supabaseUrl}/auth/v1/admin/users/${userId}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(params),
          });

          const data = await response.json();

          if (!response.ok) {
            return { data: null, error: data };
          }

          return { data, error: null };
        } catch (error) {
          return { data: null, error: { message: 'Network error', details: error } };
        }
      },

      deleteUser: async (userId: string): Promise<QueryResult> => {
        try {
          const response = await fetch(`${this.supabaseUrl}/auth/v1/admin/users/${userId}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
          });

          if (!response.ok) {
            const data = await response.json();
            return { data: null, error: data };
          }

          return { data: { success: true }, error: null };
        } catch (error) {
          return { data: null, error: { message: 'Network error', details: error } };
        }
      },
    },
  };
}

class ServiceQueryBuilder {
  private supabaseUrl: string;
  private headers: HeadersInit;
  private table: string;
  private selectColumns = '*';
  private filters: string[] = [];
  private orderBy: string[] = [];
  private limitCount?: number;
  private isSingle = false;
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private insertData?: any;
  private updateData?: any;

  constructor(supabaseUrl: string, headers: HeadersInit, table: string) {
    this.supabaseUrl = supabaseUrl;
    this.headers = headers;
    this.table = table;
  }

  select(columns = '*') {
    this.selectColumns = columns;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push(`${column}=eq.${encodeURIComponent(value)}`);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push(`${column}=neq.${encodeURIComponent(value)}`);
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    const direction = options.ascending === false ? 'desc' : 'asc';
    this.orderBy.push(`${column}.${direction}`);
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  insert(data: any) {
    this.operation = 'insert';
    this.insertData = data;
    return this;
  }

  update(data: any) {
    this.operation = 'update';
    this.updateData = data;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  single() {
    this.isSingle = true;
    return this.execute();
  }

  async then(callback: (result: QueryResult) => any): Promise<any> {
    const result = await this.execute();
    return callback(result);
  }

  private async execute(): Promise<QueryResult> {
    try {
      const headers = { ...this.headers };
      const isWrite = this.operation !== 'select';
      let url = `/rest/v1/${this.table}`;
      let method = this.operation === 'insert' ? 'POST' : this.operation === 'update' ? 'PATCH' : this.operation === 'delete' ? 'DELETE' : 'GET';
      let body: string | undefined;

      if (isWrite) {
        headers['Prefer'] = 'return=representation';
        if (this.operation === 'insert') {
          body = JSON.stringify(this.insertData);
          if (this.selectColumns !== '*') url += `?select=${encodeURIComponent(this.selectColumns)}`;
        } else if (this.operation === 'update') {
          body = JSON.stringify(this.updateData);
          if (this.filters.length) url += '?' + this.filters.join('&');
          if (this.selectColumns !== '*') url += (this.filters.length ? '&' : '?') + `select=${encodeURIComponent(this.selectColumns)}`;
        } else if (this.filters.length) {
          url += '?' + this.filters.join('&');
        }
      } else {
        url += `?select=${encodeURIComponent(this.selectColumns)}`;
        if (this.filters.length) url += '&' + this.filters.join('&');
        if (this.orderBy.length) url += `&order=${this.orderBy.join(',')}`;
        if (this.limitCount !== undefined) url += `&limit=${this.limitCount}`;
      }

      if (this.isSingle) headers['Accept'] = 'application/vnd.pgrst.object+json';

      const response = await fetch(`${this.supabaseUrl}${url}`, { method, headers, body });

      if (!response.ok) {
        const errorData = await response.text();
        return { data: null, error: { message: `HTTP ${response.status}: ${errorData}`, status: response.status } };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: { message: 'Network error', details: error } };
    }
  }
}

// Factory function to create service client
export function createServiceSupabaseClient(): ServiceSupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase configuration for service client');
    return null;
  }

  return new ServiceSupabaseClient({
    supabaseUrl,
    supabaseServiceRoleKey: serviceRoleKey,
  });
}