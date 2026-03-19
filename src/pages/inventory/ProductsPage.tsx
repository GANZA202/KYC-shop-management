import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Loader2,
  AlertCircle,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { Product, ProductCategory } from '../../types/database';
import { cn } from '../../lib/utils';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sku: '',
    product_name: '',
    category_id: '',
    unit_price: 0,
    reorder_level: 5,
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, [search, categoryFilter]);

  const fetchData = async () => {
    setLoading(true);
    const [productsRes, categoriesRes] = await Promise.all([
      inventoryService.getProducts({ search, category_id: categoryFilter }),
      inventoryService.getCategories()
    ]);
    
    if (productsRes.data) setProducts(productsRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    setLoading(false);
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        sku: product.sku,
        product_name: product.product_name,
        category_id: product.category_id || '',
        unit_price: product.unit_price,
        reorder_level: product.reorder_level,
        is_active: product.is_active
      });
    } else {
      setEditingProduct(null);
      setFormData({ sku: '', product_name: '', category_id: '', unit_price: 0, reorder_level: 5, is_active: true });
    }
    setShowModal(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      const payload = { ...formData, category_id: formData.category_id || null };
      if (editingProduct) {
        const { error } = await inventoryService.updateProduct(editingProduct.id, payload);
        if (error) throw error;
      } else {
        const { error } = await inventoryService.createProduct(payload);
        if (error) throw error;
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const toggleStatus = async (product: Product) => {
    const { error } = await inventoryService.updateProduct(product.id, { is_active: !product.is_active });
    if (error) console.error(error);
    else fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Products</h1>
          <p className="text-stone-500">Manage your shop inventory items.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Search name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-stone-200 pl-10 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-stone-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none bg-white"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-4 lg:hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200 text-stone-500">
            No products found.
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-stone-900">{product.product_name}</h3>
                  <p className="text-xs font-mono text-emerald-600">{product.sku}</p>
                </div>
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                  product.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                )}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-stone-400 uppercase font-bold text-[9px]">Category</p>
                  <p className="text-stone-700">{product.category?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-stone-400 uppercase font-bold text-[9px]">Price</p>
                  <p className="text-stone-700 font-bold">{product.unit_price.toLocaleString()} RWF</p>
                </div>
                <div>
                  <p className="text-stone-400 uppercase font-bold text-[9px]">Stock</p>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "font-bold",
                      product.quantity_in_stock <= product.reorder_level ? "text-red-600" : "text-stone-700"
                    )}>
                      {product.quantity_in_stock}
                    </span>
                    {product.quantity_in_stock <= product.reorder_level && (
                      <AlertTriangle size={12} className="text-red-500" />
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 flex justify-end gap-2">
                <button 
                  onClick={() => handleOpenModal(product)}
                  className="p-2 text-stone-400 hover:text-emerald-600 rounded-lg hover:bg-stone-50"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => toggleStatus(product)}
                  className={cn(
                    "p-2 rounded-lg hover:bg-stone-50",
                    product.is_active ? "text-stone-400 hover:text-red-600" : "text-stone-400 hover:text-emerald-600"
                  )}
                >
                  {product.is_active ? <Trash2 size={18} /> : <CheckCircle size={18} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200">
              <tr>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price (RWF)</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-emerald-600" size={24} />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-stone-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-emerald-600">{product.sku}</td>
                    <td className="px-6 py-4 font-medium text-stone-900">{product.product_name}</td>
                    <td className="px-6 py-4 text-stone-500">{product.category?.name || '-'}</td>
                    <td className="px-6 py-4 font-medium">{product.unit_price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-bold",
                          product.quantity_in_stock <= product.reorder_level ? "text-red-600" : "text-stone-900"
                        )}>
                          {product.quantity_in_stock}
                        </span>
                        {product.quantity_in_stock <= product.reorder_level && (
                          <AlertTriangle size={14} className="text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium",
                        product.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      )}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(product)}
                          className="p-1 text-stone-400 hover:text-emerald-600"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => toggleStatus(product)}
                          className={cn(
                            "p-1",
                            product.is_active ? "text-stone-400 hover:text-red-600" : "text-stone-400 hover:text-emerald-600"
                          )}
                        >
                          {product.is_active ? <Trash2 size={16} /> : <CheckCircle size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
              <h2 className="text-xl font-bold text-stone-900">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-700">SKU (Auto-generated if empty)</label>
                  <input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. SKU-0001"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-700">Product Name</label>
                  <input
                    required
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. Blue Jeans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-700">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-700">Unit Price (RWF)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={isNaN(formData.unit_price) ? '' : formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-700">Reorder Level</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={isNaN(formData.reorder_level) ? '' : formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-0 sm:pt-6">
                  <input
                    type="checkbox"
                    id="is_active_prod"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="is_active_prod" className="text-sm font-medium text-stone-700">Active</label>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-stone-300 px-6 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {formLoading ? <Loader2 size={18} className="animate-spin" /> : editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
