'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';

export default function WishlistPage() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { router.push('/login?redirect=/wishlist'); return; }
    fetch('http://127.0.0.1:8000/api/wishlist/', { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.ok ? r.json() : []).then(setItems);
  }, [user, router]);

  const remove = async (pid: number) => {
    await fetch(`http://127.0.0.1:8000/api/wishlist/${pid}`, { method: 'DELETE', headers: { Authorization: `Bearer ${user?.token}` } });
    setItems(items.filter(i => i.product_id !== pid));
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Heart className="h-6 w-6 text-pink-400 fill-pink-400" />
        <h1 className="text-3xl font-bold text-white">My Wishlist</h1>
        <span className="text-gray-500">({items.length})</span>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Your wishlist is empty. Browse products and save your favorites!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item: any) => (
            <div key={item.product_id} className="bg-gray-900/40 border border-gray-800/50 rounded-xl overflow-hidden group hover:border-gray-700/50 transition-all">
              <div className="relative aspect-[4/3] bg-gray-800/50">
                <Image src={item.image_url || '/placeholder.png'} alt={item.name} fill className="object-cover" unoptimized />
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-white text-sm">{item.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-white">${item.price?.toFixed(2)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { addToCart({id: item.product_id, name: item.name, price: item.price, image_url: item.image_url}); }}
                      className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all">
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(item.product_id)} className="p-2 bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white rounded-lg transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
