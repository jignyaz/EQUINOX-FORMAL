'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, User, Clock, ChevronRight, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const { user } = useAuth();
  useEffect(() => {
    if (!user || !user.token) { router.push('/login'); return; }
    setToken(user.token);
    fetchOrders(user.token);
  }, [user]);

  const fetchOrders = async (t: string) => {
    const res = await fetch('http://127.0.0.1:8000/api/orders/me', { headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) setOrders(await res.json());
  };


  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    const res = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}/cancel`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchOrders(token);
    else {
       const data = await res.json();
       setError(data.detail || 'Failed to cancel order');
       setTimeout(() => setError(''), 4000);
    }
  };

  const handleReturnOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to return this order?')) return;
    const res = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}/return`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchOrders(token);
    else {
       const data = await res.json();
       setError(data.detail || 'Failed to request return');
       setTimeout(() => setError(''), 4000);
    }
  };

  const handleReplaceOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to request a replacement for this order?')) return;
    const res = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}/replace`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchOrders(token);
    else {
       const data = await res.json();
       setError(data.detail || 'Failed to request replacement');
       setTimeout(() => setError(''), 4000);
    }
  };

  // Determine which FSM timeline track to show based on order status
  const getFSMTrack = (status: string) => {
    if (['Replace Requested', 'Approve Replace'].includes(status)) {
        return ['Replace Requested', 'Processing', 'Shipped', 'Delivered'];
    }
    if (['Return Requested', 'Return In Transit', 'Refunded'].includes(status)) {
        return ['Delivered', 'Return Requested', 'Return In Transit', 'Refunded'];
    }
    if (status === 'Cancelled') {
        return ['Placed', 'Cancelled'];
    }
    return ['Placed', 'Processing', 'Shipped', 'Delivered'];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex items-center gap-4 border-b border-gray-800 pb-6">
        <div className="bg-indigo-600 p-4 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)]">
          <User className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">My Account</h1>
          <p className="text-gray-400 mt-1">Manage your orders and tracked shipments</p>
        </div>
      </div>
      
      {error && <div className="bg-red-500/10 border border-red-500/40 text-red-400 p-3 rounded-xl text-sm">{error}</div>}

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Package className="text-indigo-400" /> Recent Orders</h2>
        
        {orders.length === 0 ? <p className="text-gray-500 text-center py-10">No orders found.</p> : null}
        
        {orders.map((o: any) => {
          const STAGES = getFSMTrack(o.status);
          // Find if current status is in the track, if not, find the furthest stage we reached
          // Actually, just find the index of the current status in STAGES. If it's further along (e.g. we are 'Processing' on the replace track), it handles it.
          let currentIdx = STAGES.indexOf(o.status);
          
          // Fallbacks for intermediate states not explicitly in the STAGES array
          if (currentIdx === -1) {
              if (o.status === 'Approve Replace') currentIdx = 0; // Maps to 'Replace Requested' logically for UI
              else currentIdx = 1; // Default fallback
          }

          return (
            <div key={o.id} className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 shadow-xl hover:border-gray-700 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">{o.order_ref} <span className="bg-indigo-900/40 text-indigo-400 border border-indigo-800/50 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">{o.status}</span></h3>
                  <p className="text-sm text-gray-400 mt-1">Placed on {new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">${o.total_amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">{o.items.length} items</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mb-4">
                {['Placed', 'Processing'].includes(o.status) && (
                  <button onClick={() => handleCancelOrder(o.id)} className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm font-semibold transition-colors">
                    <XCircle className="w-4 h-4" /> Cancel Order
                  </button>
                )}
                {o.status === 'Delivered' && (
                  <>
                    <button onClick={() => handleReturnOrder(o.id)} className="flex items-center gap-1 text-orange-400 hover:text-orange-300 text-sm font-semibold transition-colors bg-orange-900/20 px-3 py-1.5 rounded-lg border border-orange-800/50">
                      Return Item
                    </button>
                    <button onClick={() => handleReplaceOrder(o.id)} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-800/50">
                      Request Replacement
                    </button>
                  </>
                )}
              </div>

              {/* Dynamic FSM Progress Bar */}
              <div className="relative pt-8 pb-4">
                <div className="absolute top-10 left-0 w-full h-1 bg-gray-800 rounded-full" />
                <div className="absolute top-10 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${(currentIdx / (STAGES.length - 1)) * 100}%` }} />
                
                <div className="relative flex justify-between">
                  {STAGES.map((s, i) => (
                    <div key={s} className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full border-4 z-10 transition-all duration-500 ${i <= currentIdx ? 'bg-white border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'bg-gray-900 border-gray-700'}`} />
                      <span className={`text-[10px] sm:text-xs font-bold mt-3 ${i <= currentIdx ? 'text-white' : 'text-gray-600'}`}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Details */}
              {o.delivery_events?.length > 0 && (
                <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-400" /> Live Tracking</h4>
                  <div className="space-y-4">
                    {[...o.delivery_events].reverse().map((ev: any, i: number) => (
                      <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center mt-1">
                          <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-gray-700'}`} />
                          {i !== o.delivery_events.length - 1 && <div className="w-0.5 h-full bg-gray-800 my-1" />}
                        </div>
                        <div className="pb-4">
                          <p className={`text-sm font-bold ${i === 0 ? 'text-white' : 'text-gray-400'}`}>{ev.event_type.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-gray-500 mt-1">{ev.location} {ev.city ? `, ${ev.city}` : ''}</p>
                          <p className="text-[10px] text-gray-600 mt-1">{new Date(ev.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
