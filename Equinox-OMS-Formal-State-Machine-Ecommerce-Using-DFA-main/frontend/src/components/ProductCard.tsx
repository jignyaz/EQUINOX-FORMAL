'use client';
import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

interface Product {
  id: number; name: string; description: string; price: number;
  original_price?: number; stock: number; image_url: string;
  rating: number; review_count: number; tags?: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const isOutOfStock = product.stock === 0;
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    if (wishlisted) {
      await fetch(`http://127.0.0.1:8000/api/wishlist/${product.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${user.token}` } });
    } else {
      await fetch(`http://127.0.0.1:8000/api/wishlist/${product.id}`, { method: 'POST', headers: { Authorization: `Bearer ${user.token}` } });
    }
    setWishlisted(!wishlisted);
  };

  const discount = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : 0;

  return (
    <div className="group relative rounded-2xl border border-gray-800/60 bg-gray-900/30 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-gray-700/60 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1">
      {/* Wishlist Button */}
      {user && (
        <button onClick={toggleWishlist} className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 backdrop-blur-md text-gray-400 hover:text-pink-400 transition-all hover:scale-110">
          <Heart className={`h-4 w-4 ${wishlisted ? 'fill-pink-500 text-pink-500' : ''}`} />
        </button>
      )}

      {/* Image */}
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-800/50">
          <img src={product.image_url || "/placeholder.png"} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Tags */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.tags?.split(",").map((tag) => (
              <span key={tag} className="rounded-md bg-blue-600/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">{tag}</span>
            ))}
            {discount > 0 && <span className="rounded-md bg-green-600/90 px-2 py-0.5 text-[10px] font-bold text-white">{discount}% OFF</span>}
            {isOutOfStock && <span className="rounded-md bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white">Out of Stock</span>}
          </div>
        </div>
      </Link>

      <div className="p-4 space-y-2">
        <div className="flex items-center gap-1 text-sm">
          <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
          <span className="font-semibold text-yellow-500">{product.rating}</span>
          <span className="text-gray-500 text-xs">({product.review_count.toLocaleString()})</span>
        </div>

        <Link href={`/product/${product.id}`}>
          <h3 className="text-sm font-semibold text-gray-200 group-hover:text-blue-400 transition-colors line-clamp-1">{product.name}</h3>
        </Link>
        <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-white">${product.price.toFixed(2)}</span>
            {product.original_price && <span className="text-xs text-gray-500 line-through">${product.original_price.toFixed(2)}</span>}
          </div>
          <button onClick={handleAddToCart} disabled={isOutOfStock}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ${addedToCart ? 'bg-green-500 scale-110' : 'bg-blue-600 hover:bg-blue-500 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30'} text-white disabled:bg-gray-700 disabled:text-gray-500 disabled:hover:scale-100`}>
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
