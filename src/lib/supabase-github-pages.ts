/**
 * Supabase Client for GitHub Pages Static Deployment
 * Handles all database operations client-side since GitHub Pages doesn't support server-side code
 */

import { createClient } from '@supabase/supabase-js';
import { useClientSideOnly } from './github-pages-config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

/**
 * GitHub Pages Database Service
 * All operations are client-side using Supabase directly
 */
export class GitHubPagesDbService {
  
  // User operations
  async getUsers() {
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async createUser(userData: any) {
    const { data, error } = await supabaseClient
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateUser(id: string, userData: any) {
    const { data, error } = await supabaseClient
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteUser(id: string) {
    const { error } = await supabaseClient
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Inventory operations
  async getInventoryItems() {
    const { data, error } = await supabaseClient
      .from('inventory_items')
      .select(`
        *,
        categories (
          id,
          name
        ),
        locations (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async createInventoryItem(itemData: any) {
    const { data, error } = await supabaseClient
      .from('inventory_items')
      .insert(itemData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateInventoryItem(id: string, itemData: any) {
    const { data, error } = await supabaseClient
      .from('inventory_items')
      .update(itemData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteInventoryItem(id: string) {
    const { error } = await supabaseClient
      .from('inventory_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Categories operations
  async getCategories() {
    const { data, error } = await supabaseClient
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  async createCategory(categoryData: any) {
    const { data, error } = await supabaseClient
      .from('categories')
      .insert(categoryData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateCategory(id: string, categoryData: any) {
    const { data, error } = await supabaseClient
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteCategory(id: string) {
    const { error } = await supabaseClient
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Locations operations
  async getLocations() {
    const { data, error } = await supabaseClient
      .from('locations')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  async createLocation(locationData: any) {
    const { data, error } = await supabaseClient
      .from('locations')
      .insert(locationData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateLocation(id: string, locationData: any) {
    const { data, error } = await supabaseClient
      .from('locations')
      .update(locationData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteLocation(id: string) {
    const { error } = await supabaseClient
      .from('locations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Authentication helpers
  async getCurrentUser() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) throw error;
    return user;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  }

  async signUp(email: string, password: string, userData?: any) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    
    if (error) throw error;
    return data;
  }
}

// Export singleton instance
export const githubPagesDb = new GitHubPagesDbService(); 