'use client';
import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, CreditCard, MapPin, Loader2, Plus, AlertCircle } from 'lucide-react';

export default function CheckoutPage() {
  const { items: cart = [], total, clearCart } = useCart();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [token, setToken] = useState('');
  
  // Addresses
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ full_name: '', line1: '', city: '', state: '', pin_code: '', is_default: false });
  
  // Payment
  const [paymentType, setPaymentType] = useState('upi');
  const [paymentDetails, setPaymentDetails] = useState('');
  
  // Summary/Coupon
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  useEffect(() => {
    if (!user || !user.token) { router.push('/login?redirect=/checkout'); return; }
    setToken(user.token);
    fetchAddresses(user.token);
  }, [user]);

  const fetchAddresses = async (t: string) => {
    const res = await fetch('http://127.0.0.1:8000/api/addresses/', { headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) {
      const data = await res.json();
      setSavedAddresses(data);
      if (data.length > 0) {
        const defaultAddr = data.find((a: any) => a.is_default) || data[0];
        setSelectedAddressId(defaultAddr.id);
      } else {
        setShowAddAddress(true);
      }
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('http://127.0.0.1:8000/api/addresses/', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newAddress)
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setShowAddAddress(false);
      setNewAddress({ full_name: '', line1: '', city: '', state: '', pin_code: '', is_default: false });
      fetchAddresses(token);
      setSelectedAddressId(data.id);
    }
  };

  const applyCoupon = async () => {
    const res = await fetch(`http://127.0.0.1:8000/api/coupons/validate?code=${couponCode}&order_value=${total}`);
    const data = await res.json();
    if (res.ok && data.valid) { setDiscount(data.discount_amount); setCouponError(''); }
    else { setDiscount(0); setCouponError(data.detail || 'Invalid coupon'); }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || !paymentDetails) return;
    setLoading(true);
    
    // Find selected address details to send in payload (or backend can fetch it via address_id if we modified it)
    const addr = savedAddresses.find(a => a.id === selectedAddressId);
    
    const payload = {
      items: cart.map(i => ({ product_id: i.id, quantity: i.quantity, price: i.price })),
      shipping_address: { full_name: addr.full_name, line1: addr.line1, city: addr.city, state: addr.state, pin_code: addr.pin_code },
      payment_type: paymentType,
      payment_details: paymentDetails
    };

    const res = await fetch('http://127.0.0.1:8000/api/orders/', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    
    setLoading(false);
    if (res.ok) { clearCart(); router.push('/profile'); }
    else alert("Failed to place order");
  };

  if (cart.length === 0) return <div className="text-center py-20 text-white">Your cart is empty.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>
      
      <div className="flex gap-4 mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-2 rounded-full transition-all ${s <= step ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-gray-800'}`} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: Address */}
          <div className={`bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 transition-all ${step !== 1 && 'opacity-50 pointer-events-none'}`}>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><MapPin className="text-indigo-400" /> 1. Shipping Address</h2>
            
            {savedAddresses.length > 0 && !showAddAddress && (
              <div className="space-y-4 mb-6">
                {savedAddresses.map(addr => (
                  <div key={addr.id} onClick={() => setSelectedAddressId(addr.id)} 
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedAddressId === addr.id ? 'bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500' : 'bg-gray-800/40 border-gray-700 hover:border-gray-600'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-white">{addr.full_name} {addr.is_default && <span className="ml-2 text-[10px] bg-indigo-600 px-2 py-0.5 rounded-full">Default</span>}</p>
                        <p className="text-sm text-gray-400 mt-1">{addr.line1}, {addr.city}, {addr.state} - {addr.pin_code}</p>
                      </div>
                      {selectedAddressId === addr.id && <CheckCircle2 className="text-indigo-400 h-5 w-5" />}
                    </div>
                  </div>
                ))}
                <button onClick={() => setShowAddAddress(true)} className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-semibold"><Plus className="h-4 w-4" /> Add a new address</button>
              </div>
            )}

            {showAddAddress && (
              <form onSubmit={handleAddAddress} className="grid grid-cols-2 gap-4 mb-6">
                <input required placeholder="Full Name" value={newAddress.full_name} onChange={e => setNewAddress({...newAddress, full_name: e.target.value})} className="bg-gray-800 border-gray-700 rounded-lg p-3 text-white text-sm col-span-2" />
                <input required placeholder="Address Line 1" value={newAddress.line1} onChange={e => setNewAddress({...newAddress, line1: e.target.value})} className="bg-gray-800 border-gray-700 rounded-lg p-3 text-white text-sm col-span-2" />
                <input required placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="bg-gray-800 border-gray-700 rounded-lg p-3 text-white text-sm" />
                <input required placeholder="State" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="bg-gray-800 border-gray-700 rounded-lg p-3 text-white text-sm" />
                <input required placeholder="PIN Code" value={newAddress.pin_code} onChange={e => setNewAddress({...newAddress, pin_code: e.target.value})} className="bg-gray-800 border-gray-700 rounded-lg p-3 text-white text-sm" />
                <label className="flex items-center gap-2 text-sm text-gray-300 col-span-2"><input type="checkbox" checked={newAddress.is_default} onChange={e => setNewAddress({...newAddress, is_default: e.target.checked})} className="rounded bg-gray-800 border-gray-700 text-indigo-500" /> Set as default address</label>
                <div className="col-span-2 flex gap-3">
                  <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold text-sm">Save Address</button>
                  {savedAddresses.length > 0 && <button type="button" onClick={() => setShowAddAddress(false)} className="text-gray-400 hover:text-white px-4 py-2 text-sm font-bold">Cancel</button>}
                </div>
              </form>
            )}

            {step === 1 && !showAddAddress && selectedAddressId && (
              <button onClick={() => setStep(2)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.01] shadow-lg shadow-indigo-500/20">
                Continue to Payment <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* STEP 2: Payment */}
          <div className={`bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 transition-all ${step !== 2 && 'opacity-50 pointer-events-none'}`}>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><CreditCard className="text-indigo-400" /> 2. Payment Method</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {['upi', 'card', 'netbanking', 'cod'].map(pt => (
                <button key={pt} onClick={() => setPaymentType(pt)} className={`p-4 rounded-xl border font-bold uppercase tracking-wider text-sm transition-all ${paymentType === pt ? 'bg-indigo-900/20 border-indigo-500 text-indigo-400 ring-1 ring-indigo-500' : 'bg-gray-800/40 border-gray-700 text-gray-400 hover:border-gray-600'}`}>{pt}</button>
              ))}
            </div>
            {paymentType === 'upi' && <input placeholder="Enter UPI ID (e.g. name@okhdfcbank)" value={paymentDetails} onChange={e => setPaymentDetails(e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded-lg p-3 text-white mb-6" />}
            {paymentType === 'card' && <input placeholder="Card Number (xxxx xxxx xxxx xxxx)" value={paymentDetails} onChange={e => setPaymentDetails(e.target.value)} className="w-full bg-gray-800 border-gray-700 rounded-lg p-3 text-white mb-6" />}
            
            {step === 2 && (
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="px-6 py-3 text-gray-400 hover:text-white font-bold transition-colors">Back</button>
                <button onClick={() => setStep(3)} disabled={!paymentDetails && paymentType !== 'cod'} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-indigo-500/20">
                  Review Order <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* STEP 3: Summary */}
        <div className={`bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 h-fit sticky top-24 transition-all ${step !== 3 && 'opacity-50'}`}>
          <h3 className="text-lg font-bold text-white mb-4">Order Summary</h3>
          <div className="space-y-3 mb-6">
            {cart.map(i => (
              <div key={i.id} className="flex justify-between text-sm">
                <span className="text-gray-400">{i.quantity}x {i.name}</span>
                <span className="text-white">${(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mb-6">
            <input placeholder="Promo code" value={couponCode} onChange={e => setCouponCode(e.target.value)} className="flex-1 bg-gray-800 border-gray-700 rounded-lg px-3 py-2 text-sm text-white" />
            <button onClick={applyCoupon} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">Apply</button>
          </div>
          {couponError && <p className="text-red-400 text-xs mb-4 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{couponError}</p>}

          <div className="space-y-2 border-t border-gray-800 pt-4 mb-6">
            <div className="flex justify-between text-sm"><span className="text-gray-400">Subtotal</span><span className="text-white">${total.toFixed(2)}</span></div>
            {discount > 0 && <div className="flex justify-between text-sm text-green-400"><span>Discount</span><span>-${discount.toFixed(2)}</span></div>}
            <div className="flex justify-between text-lg font-bold text-white mt-4 border-t border-gray-800 pt-4"><span>Total</span><span>${(total - discount).toFixed(2)}</span></div>
          </div>

          {step === 3 && (
             <button onClick={handlePlaceOrder} disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:hover:scale-100">
               {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Place Order Securely'}
             </button>
          )}
        </div>
      </div>
    </div>
  );
}
