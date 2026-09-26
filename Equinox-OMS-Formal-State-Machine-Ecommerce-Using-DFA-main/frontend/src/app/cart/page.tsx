'use client';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const { items, total, removeFromCart, updateQuantity, clearCart } = useCart();
  const { user } = useAuth();

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-fade-in">
      <ShoppingBag className="h-16 w-16 text-gray-700" />
      <h2 className="text-2xl font-bold text-white">Your cart is empty</h2>
      <p className="text-gray-500">Browse our products and add something you love!</p>
      <Link href="/" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-semibold transition-all">Start Shopping</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Shopping Cart</h1>
        <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-300 transition-colors">Clear All</button>
      </div>

      <div className="space-y-3">
        {items.map(item => (
          <div key={item.id} className="flex gap-4 bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 items-center transition-all hover:border-gray-700/50">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
              <Image src={item.image_url || '/placeholder.png'} alt={item.name} fill className="object-cover" unoptimized />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{item.name}</h3>
              <p className="text-sm text-gray-400">${item.price.toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="text-white font-semibold w-8 text-center">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="text-right w-24">
              <div className="font-bold text-white">${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <button onClick={() => removeFromCart(item.id)} className="p-2 text-gray-500 hover:text-red-400 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 space-y-4">
        <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
        <div className="flex justify-between text-gray-400"><span>Tax (8%)</span><span>${(total * 0.08).toFixed(2)}</span></div>
        <div className="flex justify-between text-gray-400"><span>Shipping</span><span>{total > 500 ? 'FREE' : '$29.99'}</span></div>
        <div className="border-t border-gray-800 pt-4 flex justify-between text-xl font-bold text-white">
          <span>Total</span><span className="text-blue-400">${(total + total * 0.08 + (total > 500 ? 0 : 29.99)).toFixed(2)}</span>
        </div>
        <Link href={user ? "/checkout" : "/login?redirect=/checkout"}>
          <button className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 mt-2">
            Proceed to Checkout
          </button>
        </Link>
      </div>
    </div>
  );
}
