import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Package, 
  ShoppingCart, 
  User as UserIcon, 
  LogIn, 
  UserPlus, 
  Loader2, 
  AlertCircle,
  LogOut,
  CheckCircle2
} from 'lucide-react';

/**
 * --- TypeScript Types ---
 */

interface Product {
  id: string;
  sku: string;
  product_name: string;
  unit_price: number;
  quantity_in_stock: number;
}

interface Order {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
}

/**
 * Dashboard Component
 * 
 * Features:
 * 1. Handles Supabase Auth (Login/Signup)
 * 2. Fetches and displays products from 'products' table
 * 3. Allows creating new orders in 'orders' table
 * 4. Displays currently logged-in user email
 */
export function Dashboard() {
  // --- State Management ---
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Order Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  /**
   * 1. Initialize Auth State
   */
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * 2. Fetch Products from Supabase
   */
  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('product_name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 3. Handle Authentication (Login/Signup)
   */
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  /**
   * 4. Handle Order Creation
   */
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !user) return;

    setOrderSubmitting(true);
    setOrderSuccess(false);
    setError(null);

    try {
      const product = products.find(p => p.id === selectedProductId);
      if (!product) throw new Error('Product not found');

      const totalPrice = product.unit_price * quantity;

      const { error } = await supabase
        .from('orders')
        .insert([
          {
            user_id: user.id,
            product_id: selectedProductId,
            quantity,
            total_price: totalPrice,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      setOrderSuccess(true);
      setQuantity(1);
      setSelectedProductId('');
      
      // Optional: Refresh products if stock changed (if you have triggers)
      // fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setOrderSubmitting(false);
    }
  };

  // --- Render Loading State ---
  if (loading && !user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  // --- Render Login/Signup Form if not authenticated ---
  if (!user) {
    return (
      <div className="mx-auto max-w-md space-y-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-stone-900">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="mt-2 text-stone-500">
            {isSignUp ? 'Join our KYC Shop management system' : 'Sign in to access your dashboard'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2 text-stone-900 focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {authLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isSignUp ? (
              <><UserPlus size={18} /> Sign Up</>
            ) : (
              <><LogIn size={18} /> Sign In</>
            )}
          </button>

          <div className="mt-6 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-emerald-600 hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- Render Dashboard for Authenticated User ---
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Shop Dashboard</h1>
          <div className="mt-1 flex items-center gap-2 text-stone-500">
            <UserIcon size={16} />
            <span className="text-sm font-medium">{user.email}</span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Product List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-stone-100 bg-stone-50/50 px-6 py-4">
              <h2 className="flex items-center gap-2 font-semibold text-stone-900">
                <Package size={18} className="text-emerald-600" />
                Available Products
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3">SKU</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-stone-400">
                        No products found in the database.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-stone-900">{product.product_name}</td>
                        <td className="px-6 py-4 text-stone-500 font-mono">{product.sku}</td>
                        <td className="px-6 py-4 text-stone-900">${Number(product.unit_price).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            product.quantity_in_stock > 10 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {product.quantity_in_stock} in stock
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Create Order Form */}
        <div className="space-y-6">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 font-semibold text-stone-900 mb-6">
              <ShoppingCart size={18} className="text-emerald-600" />
              Create New Order
            </h2>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              {orderSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                  <CheckCircle2 size={16} />
                  Order placed successfully!
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Select Product</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option value="">Choose a product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.product_name} (${Number(product.unit_price).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="block w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-sm mb-4 border-t border-stone-100 pt-4">
                  <span className="text-stone-500">Total Price:</span>
                  <span className="font-bold text-stone-900">
                    ${((products.find(p => p.id === selectedProductId)?.unit_price || 0) * quantity).toFixed(2)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={orderSubmitting || !selectedProductId}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-800 disabled:opacity-50"
                >
                  {orderSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-xl bg-stone-900 p-6 text-white">
            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">System Status</h3>
            <p className="mt-2 text-2xl font-light">Supabase Connected</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Real-time synchronization active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
