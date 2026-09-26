'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';

export default function CategoryPage() {
  const params = useParams();
  const [products, setProducts] = useState([]);
  const slug = params?.slug as string;

  useEffect(() => {
    if (!slug) return;
    fetch(`http://127.0.0.1:8000/api/catalog/products?search=cat:${slug}&t=${Date.now()}`)
      .then(res => res.json()).then(setProducts).catch(() => {});
  }, [slug]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold capitalize text-white">{slug} Products</h1>
      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No products found in this category.</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p: any) => (<ProductCard key={p.id} product={p} />))}
        </div>
      )}
    </div>
  );
}
