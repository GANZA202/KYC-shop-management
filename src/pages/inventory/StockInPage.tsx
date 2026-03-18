import React, { useState, useEffect } from 'react';
import { 
  ArrowDownCircle, 
  Search, 
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { Product } from '../../types/database';

export function StockInPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 0,
    unit_price: 0,
    notes: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await inventoryService.getProducts({ activeOnly: true });
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id || formData.quantity <= 0) {
      setError('Please select a product and enter a valid quantity.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await inventoryService.stockIn(formData);
      if (error) throw error;
      
      setSuccess(true);
      setFormData({ product_id: '', quantity: 0, unit_price: 0, notes: '' });
      fetchProducts(); // Refresh stock counts
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.product_name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === formData.product_id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Stock In (Purchase)</h1>
        <p className="text-stone-500">Add new stock to your inventory from purchases.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-stone-900 mb-4">Select Product</h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-stone-200 pl-9 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {loading ? (
                <div className="py-8 text-center"><Loader2 className="mx-auto animate-spin text-emerald-600" /></div>
              ) : filteredProducts.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setFormData({ ...formData, product_id: p.id, unit_price: p.unit_price });
                    setSuccess(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    formData.product_id === p.id 
                      ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" 
                      : "border-stone-100 hover:border-stone-300"
                  }`}
                >
                  <p className="text-sm font-medium text-stone-900">{p.product_name}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs font-mono text-emerald-600">{p.sku}</span>
                    <span className="text-xs text-stone-500">Stock: {p.quantity_in_stock}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            {success && (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-emerald-700 border border-emerald-100">
                <CheckCircle2 size={20} />
                <span>Stock updated successfully!</span>
              </div>
            )}

            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 border border-red-100">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Quantity to Add</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="w-full rounded-lg border border-stone-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700">Unit Cost (RWF)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) })}
                    className="w-full rounded-lg border border-stone-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  rows={3}
                  placeholder="e.g. Supplier invoice #123"
                />
              </div>

              {selectedProduct && (
                <div className="rounded-lg bg-stone-50 p-4 border border-stone-100">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Summary</h4>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Product:</span>
                    <span className="font-medium text-stone-900">{selectedProduct.product_name}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-stone-600">New Total Stock:</span>
                    <span className="font-bold text-emerald-600">{selectedProduct.quantity_in_stock + (formData.quantity || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-stone-600">Total Value:</span>
                    <span className="font-medium text-stone-900">RWF {((formData.quantity || 0) * (formData.unit_price || 0)).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !formData.product_id}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all"
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : (
                  <>
                    <ArrowDownCircle size={20} />
                    <span>Confirm Stock In</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
