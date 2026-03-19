import { supabase } from '../lib/supabase';
import { ProductCategory, Product, StockMovement } from '../types/database';

export const inventoryService = {
  // Categories
  async getCategories() {
    return await supabase
      .from('product_categories')
      .select('*')
      .order('name');
  },

  async createCategory(category: Partial<ProductCategory>) {
    return await supabase
      .from('product_categories')
      .insert(category)
      .select()
      .single();
  },

  async updateCategory(id: string, updates: Partial<ProductCategory>) {
    return await supabase
      .from('product_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  // Products
  async getProducts(filters?: { category_id?: string; search?: string; activeOnly?: boolean }) {
    let query = supabase
      .from('products')
      .select('*, category:product_categories(*)');

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    if (filters?.search) {
      query = query.or(`product_name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }
    if (filters?.activeOnly) {
      query = query.eq('is_active', true);
    }

    return await query.order('product_name');
  },

  async createProduct(product: Partial<Product>) {
    return await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    return await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  // Stock Movements
  async getStockMovements(filters?: { search?: string; type?: string; limit?: number }) {
    let query = supabase
      .from('stock_movements')
      .select('*, product:products(*)');

    if (filters?.type) {
      query = query.eq('movement_type', filters.type);
    }

    if (filters?.search) {
      // Search in product name or SKU via the joined table
      // Note: Supabase doesn't support direct search on joined tables easily with .or() 
      // unless we use a specific syntax or a view. 
      // For now, we'll use a simpler approach or assume we might need a view for complex joins.
      // Alternatively, we can filter by product_id if we find the products first.
      // But let's try the standard way if possible.
      query = query.or(`product_name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`, { foreignTable: 'products' });
    }

    return await query
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 50);
  },

  async stockIn(movement: { product_id: string; quantity: number; unit_price: number; notes?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    return await supabase
      .from('stock_movements')
      .insert({
        ...movement,
        movement_type: 'stock_in',
        reference_type: 'purchase',
        created_by: user?.id
      })
      .select()
      .single();
  },

  async adjustStock(movement: { product_id: string; quantity: number; notes?: string }) {
    const { data: { user } } = await supabase.auth.getUser();
    return await supabase
      .from('stock_movements')
      .insert({
        ...movement,
        movement_type: 'adjustment',
        reference_type: 'manual_adjustment',
        created_by: user?.id
      })
      .select()
      .single();
  },

  async getLowStockProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:product_categories(*)')
      .eq('is_active', true)
      .order('quantity_in_stock');
    
    if (error) return { data: null, error };
    
    const lowStock = data?.filter(p => p.quantity_in_stock <= p.reorder_level) || [];
    return { data: lowStock, error: null };
  }
};
