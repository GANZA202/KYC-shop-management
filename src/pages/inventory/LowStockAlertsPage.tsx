import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Loader2,
  Package,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { inventoryService } from '../../services/inventoryService';
import { Product } from '../../types/database';

export function LowStockAlertsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStock();
  }, []);

  const fetchLowStock = async () => {
    setLoading(true);
    const { data } = await inventoryService.getLowStockProducts();
    if (data) setProducts(data);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Low Stock Alerts</h1>
          <p className="text-stone-500">Products that have reached or dropped below their reorder level.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-emerald-600" size={32} /></div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-12 text-center space-y-4 shadow-sm">
            <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <Package size={32} />
            </div>
            <h3 className="text-lg font-semibold text-stone-900">All Stock Levels Healthy</h3>
            <p className="text-stone-500 max-w-md mx-auto">No products are currently below their reorder levels. Great job managing your inventory!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(product => (
              <div key={product.id} className="rounded-xl border border-red-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-red-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-stone-900">{product.product_name}</h3>
                    <p className="text-xs font-mono text-emerald-600 uppercase">{product.sku}</p>
                  </div>
                  <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded text-[10px] font-bold uppercase">
                    {product.category?.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Current Stock</p>
                    <p className="text-xl font-bold text-red-600">{product.quantity_in_stock}</p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-lg">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Reorder Level</p>
                    <p className="text-xl font-bold text-stone-900">{product.reorder_level}</p>
                  </div>
                </div>

                <Link 
                  to="/inventory/stock-in" 
                  className="flex items-center justify-center gap-2 w-full py-2 bg-stone-900 text-white rounded-lg text-sm font-bold hover:bg-stone-800 transition-colors"
                >
                  Restock Now
                  <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
