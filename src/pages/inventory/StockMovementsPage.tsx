import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Loader2,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Settings2
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { StockMovement } from '../../types/database';
import { cn } from '../../lib/utils';

export function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    setLoading(true);
    const { data } = await inventoryService.getStockMovements();
    if (data) setMovements(data);
    setLoading(false);
  };

  const filteredMovements = movements.filter(m => {
    const matchesSearch = m.product?.product_name.toLowerCase().includes(search.toLowerCase()) ||
                         m.product?.sku.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === '' || m.movement_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Stock Movements</h1>
        <p className="text-stone-500">History of all stock changes in the system.</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Search product or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-stone-200 pl-10 pr-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-stone-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="stock_in">Stock In</option>
            <option value="stock_out">Stock Out</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto animate-spin text-emerald-600" size={24} />
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                    No movements found.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 text-stone-500">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-stone-900">{m.product?.product_name}</div>
                      <div className="text-xs font-mono text-emerald-600">{m.product?.sku}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        m.movement_type === 'stock_in' ? "bg-emerald-100 text-emerald-700" :
                        m.movement_type === 'stock_out' ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      )}>
                        {m.movement_type === 'stock_in' ? <ArrowDownRight size={12} /> :
                         m.movement_type === 'stock_out' ? <ArrowUpRight size={12} /> :
                         <Settings2 size={12} />}
                        {m.movement_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={cn(
                      "px-6 py-4 font-bold",
                      m.quantity > 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="px-6 py-4 text-stone-500 capitalize">
                      {m.reference_type?.replace('_', ' ') || '-'}
                    </td>
                    <td className="px-6 py-4 text-stone-500 max-w-xs truncate">
                      {m.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
