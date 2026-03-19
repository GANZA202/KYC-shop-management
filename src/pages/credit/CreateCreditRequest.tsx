import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { creditService } from '../../services/creditService';
import { Employee, Product } from '../../types/database';
import { 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  ShoppingBag,
  User,
  Calculator,
  Calendar
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'react-hot-toast';

interface LineItem {
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export function CreateCreditRequest() {
  const { user, profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isWindowOpen, setIsWindowOpen] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (profile?.id) {
      loadData();
    }
    checkCreditWindow();
  }, [profile]);

  const loadData = async () => {
    try {
      const [empData, prodData] = await Promise.all([
        creditService.getEmployeesForSupervisor(profile!.id),
        creditService.getProductsWithStock()
      ]);
      setEmployees(empData);
      setProducts(prodData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load employees or products');
    }
  };

  const checkCreditWindow = () => {
    const day = new Date().getDate();
    setIsWindowOpen(day <= 20);
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedEmployeeId(id);
    const emp = employees.find(e => e.id === id) || null;
    setSelectedEmployee(emp);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { productId: '', quantity: 1, unitPrice: 0, lineTotal: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...lineItems];
    const item = { ...newItems[index] };

    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      item.productId = value;
      item.product = product;
      item.unitPrice = product?.unit_price || 0;
    } else if (field === 'quantity') {
      item.quantity = parseInt(value) || 0;
    }

    item.lineTotal = item.quantity * item.unitPrice;
    newItems[index] = item;
    setLineItems(newItems);
  };

  const totalAmount = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const creditLimit = selectedEmployee?.worker_type === 'supervisor' ? 80000 : 40000;
  const remainingBalance = creditLimit - totalAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWindowOpen) {
      toast.error('Credit window is closed (Day 1-20 only)');
      return;
    }
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }
    if (lineItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }
    if (totalAmount > creditLimit) {
      toast.error('Total amount exceeds credit limit');
      return;
    }
    if (lineItems.some(item => !item.productId || item.quantity <= 0)) {
      toast.error('Please fill all item details correctly');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const deductionMonth = now.toISOString().slice(0, 7); // YYYY-MM

      await creditService.createCreditRequest(
        {
          employee_id: selectedEmployee.id,
          supervisor_id: profile!.id,
          sector_id: selectedEmployee.sector_id!,
          total_amount: totalAmount,
          credit_limit: creditLimit,
          deduction_month: deductionMonth,
          notes,
          request_date: now.toISOString().split('T')[0]
        },
        lineItems.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          line_total: item.lineTotal
        }))
      );

      toast.success('Credit request submitted successfully');
      setSelectedEmployeeId('');
      setSelectedEmployee(null);
      setLineItems([]);
      setNotes('');
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit credit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Create Credit Request</h1>
        <div className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${
          isWindowOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          {isWindowOpen ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          Credit Window: {isWindowOpen ? 'Open' : 'Closed'}
        </div>
      </div>

      {!isWindowOpen && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-start gap-3">
          <AlertCircle className="mt-0.5" size={18} />
          <div>
            <p className="font-bold">Window Closed</p>
            <p className="text-sm">Credit requests are only allowed between the 1st and 20th of each month.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employee Selection */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-stone-900 font-semibold">
            <User size={20} className="text-emerald-600" />
            <h2>Employee Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Select Employee</label>
              <select
                required
                value={selectedEmployeeId}
                onChange={handleEmployeeChange}
                className="w-full rounded-lg border-stone-300 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">-- Choose Worker --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_code})</option>
                ))}
              </select>
            </div>

            {selectedEmployee && (
              <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-lg border border-stone-100">
                <div>
                  <p className="text-[10px] uppercase font-bold text-stone-400">Worker Type</p>
                  <p className="text-sm font-semibold text-stone-900 capitalize">{selectedEmployee.worker_type}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-stone-400">Credit Limit</p>
                  <p className="text-sm font-semibold text-emerald-600">{formatCurrency(creditLimit)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-stone-400">Sector</p>
                  <p className="text-sm font-semibold text-stone-900">{(selectedEmployee as any).sector?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-stone-400">Supervisor</p>
                  <p className="text-sm font-semibold text-stone-900">{profile?.full_name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-stone-900 font-semibold">
              <ShoppingBag size={20} className="text-emerald-600" />
              <h2>Requested Items</h2>
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end border-b border-stone-100 pb-4 last:border-0 last:pb-0">
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Product</label>
                  <select
                    required
                    value={item.productId}
                    onChange={(e) => updateLineItem(index, 'productId', e.target.value)}
                    className="w-full rounded-lg border-stone-300 text-sm bg-white"
                  >
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.product_name} ({formatCurrency(p.unit_price)})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:col-span-2 lg:col-span-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Stock</label>
                    <input
                      type="text"
                      readOnly
                      value={item.product?.quantity_in_stock || 0}
                      className="w-full rounded-lg border-stone-200 bg-stone-50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={isNaN(item.quantity) ? '' : item.quantity}
                      onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                      className="w-full rounded-lg border-stone-300 text-sm"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Total</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={formatCurrency(item.lineTotal)}
                      className="w-full rounded-lg border-stone-200 bg-stone-50 text-sm font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {lineItems.length === 0 && (
              <div className="text-center py-8 text-stone-400 border-2 border-dashed border-stone-100 rounded-xl">
                No items added yet. Click "Add Item" to start.
              </div>
            )}
          </div>
        </div>

        {/* Summary & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
            <label className="block text-sm font-medium text-stone-700 mb-2">Notes / Reason</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border-stone-300 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Optional notes about this request..."
            />
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-stone-900 font-semibold mb-2">
              <Calculator size={20} className="text-emerald-600" />
              <h2>Summary</h2>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Total Amount:</span>
                <span className="font-bold text-stone-900">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Credit Limit:</span>
                <span className="font-bold text-stone-900">{formatCurrency(creditLimit)}</span>
              </div>
              <div className="pt-2 border-t border-stone-100 flex justify-between">
                <span className="text-sm font-bold text-stone-700">Remaining:</span>
                <span className={`font-bold ${remainingBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatCurrency(remainingBalance)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isWindowOpen || remainingBalance < 0 || lineItems.length === 0}
              className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
