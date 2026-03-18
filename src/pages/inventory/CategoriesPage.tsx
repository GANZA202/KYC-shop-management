import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { ProductCategory } from '../../types/database';
import { cn } from '../../lib/utils';

export function CategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await inventoryService.getCategories();
    if (error) console.error(error);
    else setCategories(data || []);
    setLoading(false);
  };

  const handleOpenModal = (category?: ProductCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        is_active: category.is_active
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', description: '', is_active: true });
    }
    setShowModal(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      if (editingCategory) {
        const { error } = await inventoryService.updateCategory(editingCategory.id, formData);
        if (error) throw error;
      } else {
        const { error } = await inventoryService.createCategory(formData);
        if (error) throw error;
      }
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const toggleStatus = async (category: ProductCategory) => {
    const { error } = await inventoryService.updateCategory(category.id, { is_active: !category.is_active });
    if (error) console.error(error);
    else fetchCategories();
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Product Categories</h1>
          <p className="text-stone-500">Organize your products into logical groups.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={18} />
          <span>Add Category</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-stone-200 pl-10 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <Loader2 className="mx-auto animate-spin text-emerald-600" size={24} />
                </td>
              </tr>
            ) : filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                  No categories found.
                </td>
              </tr>
            ) : (
              filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-stone-900">{category.name}</td>
                  <td className="px-6 py-4 text-stone-500">{category.description || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium",
                      category.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    )}>
                      {category.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-stone-500">
                    {new Date(category.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenModal(category)}
                        className="p-1 text-stone-400 hover:text-emerald-600"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => toggleStatus(category)}
                        className={cn(
                          "p-1",
                          category.is_active ? "text-stone-400 hover:text-red-600" : "text-stone-400 hover:text-emerald-600"
                        )}
                      >
                        {category.is_active ? <Trash2 size={16} /> : <CheckCircle size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
              <h2 className="text-xl font-bold text-stone-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
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

              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">Category Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. Clothing, Accessories"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-stone-700">Active</label>
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
                  {formLoading ? <Loader2 size={18} className="animate-spin" /> : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
