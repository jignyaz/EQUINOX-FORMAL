'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { Star, ShoppingCart, Heart, ArrowLeft, Shield, Truck, RotateCcw } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/catalog/products?t=${Date.now()}`).then(r => r.json()).then(data => {
      const p = data.find((item: any) => item.id === Number(params.id));
      if (p) setProduct(p);
    });
    fetch(`http://127.0.0.1:8000/api/reviews/products/${params.id}`).then(r => r.ok ? r.json() : []).then(setReviews);
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < qty; i++) addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const submitReview = async () => {
    if (!user) return;
    await fetch(`http://127.0.0.1:8000/api/reviews/products/${params.id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
      body: JSON.stringify({ rating: reviewRating, body: reviewText })
    });
    setReviewText('');
    const r = await fetch(`http://127.0.0.1:8000/api/reviews/products/${params.id}`);
    if (r.ok) setReviews(await r.json());
  };

  if (!product) return <div className="text-center py-20 text-gray-500">Loading...</div>;
  const discount = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-800/50 border border-gray-800/60">
          <img src={product.image_url} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
          {discount > 0 && <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-bold">{discount}% OFF</div>}
        </div>

        {/* Details */}
        <div className="space-y-6">
          {product.tags && (
            <div className="flex gap-2">{product.tags.split(',').map((t: string) => (
              <span key={t} className="px-2 py-0.5 rounded-md bg-blue-600/20 text-blue-400 text-xs font-bold uppercase">{t}</span>
            ))}</div>
          )}
          <h1 className="text-3xl font-bold text-white">{product.name}</h1>
          <div className="flex items-center gap-2">
            <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`h-5 w-5 ${s <= Math.round(product.rating) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-700'}`} />)}</div>
            <span className="text-sm text-gray-400">{product.rating} ({product.review_count.toLocaleString()} reviews)</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-white">${product.price.toFixed(2)}</span>
            {product.original_price && <span className="text-xl text-gray-500 line-through">${product.original_price.toFixed(2)}</span>}
          </div>
          <p className="text-gray-400 leading-relaxed">{product.description}</p>
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center border border-gray-700 rounded-xl overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">-</button>
              <span className="px-4 py-2 text-white font-semibold min-w-[3rem] text-center">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">+</button>
            </div>
            <button onClick={handleAddToCart} disabled={product.stock === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all ${added ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 hover:-translate-y-0.5'} disabled:bg-gray-700 disabled:text-gray-500`}>
              <ShoppingCart className="h-5 w-5" />
              {added ? 'Added!' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-800">
            <div className="flex flex-col items-center gap-1 text-center p-3 rounded-xl bg-gray-800/30">
              <Truck className="h-5 w-5 text-blue-400" /><span className="text-xs text-gray-400">Free Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center p-3 rounded-xl bg-gray-800/30">
              <RotateCcw className="h-5 w-5 text-green-400" /><span className="text-xs text-gray-400">Easy Returns</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center p-3 rounded-xl bg-gray-800/30">
              <Shield className="h-5 w-5 text-purple-400" /><span className="text-xs text-gray-400">Secure Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-white">Customer Reviews ({reviews.length})</h2>
        {user && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">Write a Review</h3>
            <div className="flex gap-1">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setReviewRating(s)}><Star className={`h-5 w-5 ${s <= reviewRating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600'}`} /></button>)}</div>
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your experience..." className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500 resize-none h-20" />
            <button onClick={submitReview} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all">Submit Review</button>
          </div>
        )}
        <div className="space-y-3">
          {reviews.map((r: any) => (
            <div key={r.id} className="bg-gray-900/30 border border-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-700'}`} />)}</div>
                <span className="text-xs text-gray-500">{r.customer_name} - {new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.body && <p className="text-sm text-gray-300">{r.body}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
