import ProductCard from "@/components/ProductCard";

interface Product {
  id: number; name: string; description: string; price: number;
  original_price?: number; stock: number; image_url: string;
  rating: number; review_count: number; tags?: string;
}

export default async function Home() {
  let products: Product[] = [];
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/catalog/products?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const allProducts = await res.json();
      products = allProducts.slice(0, 25);
    }
  } catch (error) { console.error("Backend offline", error); }

  return (
    <div className="space-y-10">
      {/* Hero Banner */}
      <section className="relative rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-black p-10 border border-gray-800/50 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute right-40 top-20 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 bottom-0 w-72 h-72 bg-purple-600/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Powered by Finite State Machines
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl leading-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Equinox OMS</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            A premium e-commerce experience with order management driven by Deterministic Finite Automata. Track your orders in real-time through every FSM state.
          </p>
          <div className="flex gap-3 pt-2">
            <a href="#products" className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:-translate-y-0.5">
              Shop Now
            </a>
            <a href="/admin/orders" className="rounded-xl bg-gray-800/80 px-6 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-700 border border-gray-700/50 hover:text-white transition-all">
              FSM Dashboard
            </a>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section id="products">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Featured Products</h2>
          <span className="text-sm text-gray-500">{products.length} items</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
