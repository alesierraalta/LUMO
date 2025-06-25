/**
 * Supabase Mock for Testing Environment
 * Provides a complete mock implementation for GitHub Actions testing
 */

// Mock data storage
const mockData: Record<string, any[]> = {
  roles: [],
  users: [],
  categories: [],
  products: [],
  inventory_items: [],
  stock_movements: [],
  suppliers: [],
  price_history: []
};

// Mock response builder
const createMockResponse = (data: any = null, error: any = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK'
});

// Mock query builder
class MockQueryBuilder {
  private table: string;
  private mockData: any[];
  private filters: any[] = [];
  private selectFields = '*';
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitValue: number | null = null;

  constructor(table: string) {
    this.table = table;
    this.mockData = mockData[table] || [];
  }

  select(fields = '*') {
    this.selectFields = fields;
    return this;
  }

  insert(data: any) {
    const newItem = Array.isArray(data) ? data : [data];
    newItem.forEach((item, index) => {
      const id = Math.floor(Math.random() * 10000) + 1;
      const itemWithId = { id, ...item, created_at: new Date().toISOString() };
      this.mockData.push(itemWithId);
    });
    
    return {
      select: () => ({
        single: () => Promise.resolve(createMockResponse(newItem[0]))
      }),
      then: (callback: any) => callback(createMockResponse(newItem))
    };
  }

  update(data: any) {
    // Simple update mock - in real scenario would apply filters
    const updated = this.mockData.map(item => ({ ...item, ...data }));
    return {
      eq: (column: string, value: any) => ({
        select: () => ({
          single: () => Promise.resolve(createMockResponse(updated[0]))
        })
      })
    };
  }

  delete() {
    return {
      eq: (column: string, value: any) => {
        const index = this.mockData.findIndex(item => item[column] === value);
        if (index !== -1) {
          const deleted = this.mockData.splice(index, 1);
          return Promise.resolve(createMockResponse(deleted[0]));
        }
        return Promise.resolve(createMockResponse(null, { message: 'Not found' }));
      }
    };
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ type: 'gt', column, value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ type: 'gte', column, value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ type: 'lt', column, value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ type: 'lte', column, value });
    return this;
  }

  like(column: string, pattern: string) {
    this.filters.push({ type: 'like', column, pattern });
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters.push({ type: 'ilike', column, pattern });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ type: 'in', column, values });
    return this;
  }

  is(column: string, value: any) {
    this.filters.push({ type: 'is', column, value });
    return this;
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.orderBy = { column, ascending: options.ascending !== false };
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  range(from: number, to: number) {
    this.limitValue = to - from + 1;
    return this;
  }

  single() {
    const results = this.applyFilters();
    const result = results.length > 0 ? results[0] : null;
    return Promise.resolve(createMockResponse(result));
  }

  maybeSingle() {
    return this.single();
  }

  then(callback: any) {
    const results = this.applyFilters();
    return callback(createMockResponse(results));
  }

  private applyFilters() {
    let results = [...this.mockData];

    // Apply filters
    this.filters.forEach(filter => {
      results = results.filter(item => {
        const value = item[filter.column];
        switch (filter.type) {
          case 'eq':
            return value === filter.value;
          case 'neq':
            return value !== filter.value;
          case 'gt':
            return value > filter.value;
          case 'gte':
            return value >= filter.value;
          case 'lt':
            return value < filter.value;
          case 'lte':
            return value <= filter.value;
          case 'like':
          case 'ilike':
            const pattern = filter.pattern.replace(/%/g, '.*');
            const regex = new RegExp(pattern, filter.type === 'ilike' ? 'i' : '');
            return regex.test(String(value));
          case 'in':
            return filter.values.includes(value);
          case 'is':
            return value === filter.value;
          default:
            return true;
        }
      });
    });

    // Apply ordering
    if (this.orderBy) {
      results.sort((a, b) => {
        const aVal = a[this.orderBy!.column];
        const bVal = b[this.orderBy!.column];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return this.orderBy!.ascending ? comparison : -comparison;
      });
    }

    // Apply limit
    if (this.limitValue) {
      results = results.slice(0, this.limitValue);
    }

    return results;
  }
}

// Mock Supabase client
export const createMockSupabaseClient = () => ({
  from: (table: string) => new MockQueryBuilder(table),
  
  auth: {
    getUser: () => Promise.resolve({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null
    }),
    getSession: () => Promise.resolve({
      data: { session: { access_token: 'mock-token' } },
      error: null
    }),
    signInWithPassword: () => Promise.resolve({
      data: { user: { id: 'test-user-id' }, session: { access_token: 'mock-token' } },
      error: null
    }),
    signOut: () => Promise.resolve({ error: null })
  },

  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: { path: 'mock-path' }, error: null }),
      download: () => Promise.resolve({ data: new Blob(), error: null }),
      remove: () => Promise.resolve({ data: [], error: null })
    })
  },

  rpc: (functionName: string, params: any = {}) => {
    // Mock RPC calls
    switch (functionName) {
      case 'get_inventory_summary':
        return Promise.resolve(createMockResponse({ total: 100, low_stock: 5 }));
      default:
        return Promise.resolve(createMockResponse({}));
    }
  }
});

// Helper to reset mock data
export const resetMockData = () => {
  Object.keys(mockData).forEach(key => {
    mockData[key] = [];
  });
};

// Helper to seed mock data
export const seedMockData = (table: string, data: any[]) => {
  mockData[table] = [...data];
};

// Export for Jest setup
export default createMockSupabaseClient; 