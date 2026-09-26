'use client';
import { useEffect, useState, useCallback } from 'react';
import { MapPin, Plus, Send } from 'lucide-react';

const ACTION_STYLES: Record<string, string> = {
  process: 'bg-indigo-600 hover:bg-indigo-500', ship: 'bg-green-600 hover:bg-green-500',
  deliver: 'bg-emerald-600 hover:bg-emerald-500', cancel: 'bg-red-600 hover:bg-red-500',
  return_request: 'bg-yellow-600 hover:bg-yellow-500', pickup: 'bg-orange-600 hover:bg-orange-500',
  refund: 'bg-pink-600 hover:bg-pink-500', replace_request: 'bg-purple-600 hover:bg-purple-500',
  approve_replace: 'bg-violet-600 hover:bg-violet-500',
};

const STATE_BADGE: Record<string, string> = {
  'Placed': 'bg-blue-900/50 text-blue-400 border-blue-700', 'Processing': 'bg-indigo-900/50 text-indigo-400 border-indigo-700',
  'Shipped': 'bg-green-900/50 text-green-400 border-green-700', 'Delivered': 'bg-emerald-900/50 text-emerald-400 border-emerald-700',
  'Cancelled': 'bg-red-900/50 text-red-400 border-red-700', 'Return Requested': 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
  'Return In Transit': 'bg-orange-900/50 text-orange-400 border-orange-700', 'Refunded': 'bg-pink-900/50 text-pink-400 border-pink-700',
  'Replace Requested': 'bg-purple-900/50 text-purple-400 border-purple-700',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [opToken, setOpToken] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [orderActions, setOrderActions] = useState<Record<number, any[]>>({});
  const [deliveryForm, setDeliveryForm] = useState<number | null>(null);
  const [dForm, setDForm] = useState({ event_type: 'PICKED_UP', location: '', city: '', pincode: '', courier_name: '', tracking_id: '', next_location: '', notes: '' });

  const flash = (msg: string, isErr = false) => {
    isErr ? setError(msg) : setMessage(msg);
    setTimeout(() => { setError(''); setMessage(''); }, 4000);
  };

  const fetchActions = async (token: string, orderId: number) => {
    const res = await fetch(`http://127.0.0.1:8000/api/admin/orders/${orderId}/actions`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setOrderActions(prev => ({ ...prev, [orderId]: d.actions })); }
  };

  const fetchOrders = useCallback(async (token: string) => {
    const res = await fetch('http://127.0.0.1:8000/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const data = await res.json(); setOrders(data); data.forEach((o: any) => fetchActions(token, o.id)); }
  }, []);

  useEffect(() => {
    const loginOp = async () => {
      const res = await fetch('http://127.0.0.1:8000/api/auth/operator/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@techstore.com', password: 'Admin@1234' })
      });
      if (res.ok) { const d = await res.json(); setOpToken(d.access_token); fetchOrders(d.access_token); }
      else flash('Operator auth failed. Re-run seed.py.', true);
    };
    loginOp();
  }, [fetchOrders]);

  const transitionOrder = async (orderId: number, action: string) => {
    const res = await fetch(`http://127.0.0.1:8000/api/admin/orders/${orderId}/transition`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opToken}` },
      body: JSON.stringify({ action })
    });
    const data = await res.json();
    if (!res.ok || !data.success) flash(data.error || data.detail || 'Transition failed.', true);
    else { flash(`${data.old_state} -> ${data.new_state}`); fetchOrders(opToken); }
  };

  const submitDelivery = async (orderId: number) => {
    const res = await fetch(`http://127.0.0.1:8000/api/admin/orders/${orderId}/delivery-event`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opToken}` },
      body: JSON.stringify(dForm)
    });
    if (res.ok) { flash('Delivery event logged!'); setDeliveryForm(null); setDForm({ event_type: 'PICKED_UP', location: '', city: '', pincode: '', courier_name: '', tracking_id: '', next_location: '', notes: '' }); fetchOrders(opToken); }
    else flash('Failed to log delivery event', true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Order Management System</h1>
      {error && <div className="bg-red-500/10 border border-red-500/40 text-red-400 p-3 rounded-xl text-sm">{error}</div>}
      {message && <div className="bg-green-500/10 border border-green-500/40 text-green-400 p-3 rounded-xl text-sm">{message}</div>}

      <div className="grid gap-5">
        {orders.map((o: any) => {
          const badge = STATE_BADGE[o.status] || 'bg-gray-800 text-gray-400 border-gray-700';
          const actions = orderActions[o.id] || [];
          return (
            <div key={o.id} className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white">{o.order_ref}</h3>
                  <p className="text-sm text-gray-500 mt-1">${o.total_amount?.toFixed(2)} | {new Date(o.created_at).toLocaleString()}</p>
                </div>
                <span className={`border px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badge}`}>{o.status}</span>
              </div>

              {/* FSM Actions */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1">FSM:</span>
                {actions.length === 0 ? <span className="text-xs text-gray-600 italic">Terminal state</span> : actions.map(({action, label}: any) => (
                  <button key={action} onClick={() => transitionOrder(o.id, action)}
                    className={`text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 ${ACTION_STYLES[action] || 'bg-gray-600 hover:bg-gray-500'}`}>{label}</button>
                ))}
              </div>

              {/* Delivery Event Form (visible for Shipped orders) */}
              {o.status === 'Shipped' && (
                deliveryForm === o.id ? (
                  <div className="bg-gray-900/60 border border-gray-700/50 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-400" /> Log Delivery Checkpoint</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <select value={dForm.event_type} onChange={e => setDForm({...dForm, event_type: e.target.value})} className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-xs">
                        <option value="PICKED_UP">Picked Up</option><option value="IN_TRANSIT">In Transit</option>
                        <option value="AT_HUB">At Sorting Hub</option><option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                        <option value="DELIVERED">Delivered</option><option value="FAILED_ATTEMPT">Failed Attempt</option>
                      </select>
                      <input value={dForm.courier_name} onChange={e => setDForm({...dForm, courier_name: e.target.value})} placeholder="Courier Name" className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-xs" />
                      <input value={dForm.location} onChange={e => setDForm({...dForm, location: e.target.value})} placeholder="Location / Hub Name" className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-xs" />
                      <input value={dForm.city} onChange={e => setDForm({...dForm, city: e.target.value})} placeholder="City" className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-xs" />
                      <input value={dForm.pincode} onChange={e => setDForm({...dForm, pincode: e.target.value})} placeholder="Pincode" className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-xs" />
                      <input value={dForm.tracking_id} onChange={e => setDForm({...dForm, tracking_id: e.target.value})} placeholder="AWB / Tracking ID" className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-xs" />
                      <input value={dForm.next_location} onChange={e => setDForm({...dForm, next_location: e.target.value})} placeholder="Next Expected Location" className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-xs" />
                      <input value={dForm.notes} onChange={e => setDForm({...dForm, notes: e.target.value})} placeholder="Notes" className="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white text-xs" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => submitDelivery(o.id)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all"><Send className="h-3.5 w-3.5" />Submit</button>
                      <button onClick={() => setDeliveryForm(null)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-xs transition-all">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setDeliveryForm(o.id)} className="flex items-center gap-2 bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-800/30 px-4 py-2 rounded-lg text-xs font-semibold transition-all">
                    <Plus className="h-3.5 w-3.5" /> Add Delivery Checkpoint
                  </button>
                )
              )}

              {/* Delivery Events */}
              {o.delivery_events?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-800/50">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Delivery Log</p>
                  {o.delivery_events.map((ev: any, i: number) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-300">{ev.event_type.replace(/_/g, ' ')}</span>
                        <span className="text-gray-500 ml-2">{ev.location}{ev.city ? `, ${ev.city}` : ''}</span>
                        {ev.courier_name && <span className="text-gray-600 ml-2">({ev.courier_name})</span>}
                        <span className="text-gray-700 ml-2">{new Date(ev.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FSM Timeline */}
              {o.timeline?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-800/50">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">FSM Timeline</p>
                  {o.timeline.map((t: any, i: number) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-white">{t.status}</span>
                        <span className="text-gray-600 ml-2">{new Date(t.timestamp).toLocaleString()}</span>
                        {t.detail && <p className="text-gray-500">{t.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {orders.length === 0 && !error && <div className="text-center py-16 text-gray-500">No orders yet.</div>}
      </div>
    </div>
  );
}
