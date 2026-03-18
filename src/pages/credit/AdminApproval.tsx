import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { creditService } from '../../services/creditService';
import { CreditRequest } from '../../types/database';
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Clock,
  AlertCircle,
  Search,
  Filter,
  Package
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export function AdminApproval() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CreditRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      const data = await creditService.getPendingRequests();
      setRequests(data);
    } catch (error) {
      console.error('Error loading pending requests:', error);
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const data = await creditService.getRequestDetails(id);
      setSelectedRequest(data);
      setShowModal(true);
    } catch (error) {
      console.error('Error loading details:', error);
      toast.error('Failed to load request details');
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm('Are you sure you want to approve this request? Stock will be deducted.')) return;
    
    setProcessing(true);
    try {
      await creditService.approveRequest(id, profile!.id);
      toast.success('Request approved and stock updated');
      setShowModal(false);
      loadPendingRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      await creditService.rejectRequest(id, rejectionReason);
      toast.success('Request rejected');
      setShowModal(false);
      setRejectionReason('');
      loadPendingRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Credit Requests Approval</h1>
          <p className="text-stone-500">Review and approve pending credit requests from supervisors.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Request #</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Employee</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Supervisor</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] uppercase font-bold text-stone-400 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-stone-400">
                    No pending credit requests.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-stone-900">{req.request_number}</span>
                        <span className="text-xs text-stone-500">{formatDate(req.request_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-stone-900">{req.employee?.full_name}</span>
                        <span className="text-xs text-stone-500">{req.employee?.employee_code}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-stone-900">{req.supervisor?.full_name}</span>
                        <span className="text-xs text-stone-500">{req.sector?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-stone-900">{formatCurrency(req.total_amount)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleViewDetails(req.id)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Request Details</h2>
                <p className="text-sm text-stone-500">{selectedRequest.request_number}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-stone-400">Employee</p>
                  <p className="font-semibold text-stone-900">{selectedRequest.employee?.full_name}</p>
                  <p className="text-xs text-stone-500">{selectedRequest.employee?.employee_code} | {selectedRequest.employee?.worker_type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-stone-400">Supervisor</p>
                  <p className="font-semibold text-stone-900">{selectedRequest.supervisor?.full_name}</p>
                  <p className="text-xs text-stone-500">{selectedRequest.sector?.name}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] uppercase font-bold text-stone-400">Requested Items</p>
                <div className="border border-stone-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-bold text-stone-600">Product</th>
                        <th className="px-4 py-2 text-center font-bold text-stone-600">Qty</th>
                        <th className="px-4 py-2 text-right font-bold text-stone-600">Price</th>
                        <th className="px-4 py-2 text-right font-bold text-stone-600">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {selectedRequest.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-stone-900">{item.product?.product_name}</td>
                          <td className="px-4 py-2 text-center text-stone-900">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-stone-900">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-2 text-right font-semibold text-stone-900">{formatCurrency(item.line_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-stone-50 font-bold">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-right text-stone-600">Grand Total</td>
                        <td className="px-4 py-2 text-right text-emerald-600">{formatCurrency(selectedRequest.total_amount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedRequest.notes && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-stone-400">Notes</p>
                  <p className="text-sm text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-100">{selectedRequest.notes}</p>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-[10px] uppercase font-bold text-stone-400">Decision</p>
                <textarea
                  placeholder="Reason for rejection (required if rejecting)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-lg border-stone-300 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                  rows={2}
                />
              </div>
            </div>

            <div className="p-6 border-t border-stone-100 bg-stone-50 flex gap-4">
              <button
                disabled={processing}
                onClick={() => handleReject(selectedRequest.id)}
                className="flex-1 py-2 px-4 border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle size={18} />
                Reject
              </button>
              <button
                disabled={processing}
                onClick={() => handleApprove(selectedRequest.id)}
                className="flex-1 py-2 px-4 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                {processing ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Approve & Deduct Stock
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
