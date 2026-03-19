import { supabase } from '../lib/supabase';
import { CreditRequest, CreditRequestItem, Employee, Product } from '../types/database';

export const creditService = {
  async getEmployeesForSupervisor(supervisorId: string) {
    const { data, error } = await supabase
      .from('employees')
      .select('*, sector:sectors(*)')
      .eq('supervisor_id', supervisorId)
      .eq('status', 'active');
    
    if (error) throw error;
    return data;
  },

  async getProductsWithStock() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .gt('quantity_in_stock', 0);
    
    if (error) throw error;
    return data;
  },

  async createCreditRequest(
    request: Partial<CreditRequest>,
    items: Partial<CreditRequestItem>[]
  ) {
    // 1. Generate request number
    const now = new Date();
    const monthStr = now.toISOString().slice(0, 7).replace('-', '');
    
    const { data: lastReq } = await supabase
      .from('credit_requests')
      .select('request_number')
      .like('request_number', `CR-${monthStr}-%`)
      .order('request_number', { ascending: false })
      .limit(1);
    
    let nextNum = 1;
    if (lastReq && lastReq.length > 0) {
      const lastNum = parseInt(lastReq[0].request_number.split('-')[2]);
      nextNum = lastNum + 1;
    }
    const requestNumber = `CR-${monthStr}-${nextNum.toString().padStart(4, '0')}`;

    // 2. Insert request
    const { data: newRequest, error: reqError } = await supabase
      .from('credit_requests')
      .insert({
        ...request,
        request_number: requestNumber,
        status: 'pending'
      })
      .select()
      .single();

    if (reqError) throw reqError;

    // 3. Insert items
    const itemsToInsert = items.map(item => ({
      ...item,
      credit_request_id: newRequest.id
    }));

    const { error: itemsError } = await supabase
      .from('credit_request_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;

    return newRequest;
  },

  async getSupervisorRequests(supervisorId: string, filters?: { search?: string; status?: string }) {
    let query = supabase
      .from('credit_requests')
      .select('*, employee:employees(*)');

    if (supervisorId) {
      query = query.eq('supervisor_id', supervisorId);
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      // Search in request number or employee name
      // Using .or with foreign table for employee name
      query = query.or(`request_number.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`, { foreignTable: 'employees' });
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getPendingRequests() {
    const { data, error } = await supabase
      .from('credit_requests')
      .select('*, employee:employees(*), supervisor:profiles(*), sector:sectors(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  async getRequestDetails(requestId: string) {
    const { data, error } = await supabase
      .from('credit_requests')
      .select('*, employee:employees(*), supervisor:profiles(*), sector:sectors(*), items:credit_request_items(*, product:products(*))')
      .eq('id', requestId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async approveRequest(requestId: string, adminId: string) {
    const { error } = await supabase.rpc('approve_credit_request', {
      p_request_id: requestId,
      p_admin_id: adminId
    });
    
    if (error) throw error;
  },

  async rejectRequest(requestId: string, reason: string) {
    const { error } = await supabase
      .from('credit_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
    
    if (error) throw error;
  },

  async getWorkerDebtHistory(employeeId: string) {
    const { data, error } = await supabase
      .from('credit_requests')
      .select('*, items:credit_request_items(*, product:products(*))')
      .eq('employee_id', employeeId)
      .order('request_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};
