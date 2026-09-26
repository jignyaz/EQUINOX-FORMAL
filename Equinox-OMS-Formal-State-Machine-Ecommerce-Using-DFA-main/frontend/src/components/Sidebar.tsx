import Link from "next/link";
import { Shirt, Monitor, Apple, Baby, ShoppingBag, Sparkles, LayoutDashboard, Settings } from "lucide-react";

export default function Sidebar() {
  const categories = [
    { name: "Mens", icon: <Shirt className="w-4 h-4" />, slug: "mens" },
    { name: "Womens", icon: <Sparkles className="w-4 h-4" />, slug: "womens" },
    { name: "Electronics", icon: <Monitor className="w-4 h-4" />, slug: "electronics" },
    { name: "Groceries", icon: <Apple className="w-4 h-4" />, slug: "groceries" },
    { name: "Kids", icon: <Baby className="w-4 h-4" />, slug: "kids" },
  ];

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-gray-800/60 bg-black/40 backdrop-blur-sm p-4 h-[calc(100vh-4rem)] sticky top-16 gap-6">
      <div className="space-y-1">
        <h2 className="px-3 text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">Categories</h2>
        {categories.map((cat) => (
          <Link key={cat.name} href={`/category/${cat.slug}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800/60 hover:text-white transition-all group">
            <span className="group-hover:text-blue-400 transition-colors">{cat.icon}</span>
            <span className="font-medium">{cat.name}</span>
          </Link>
        ))}
      </div>

      <div className="mt-auto space-y-2">
        <h2 className="px-3 text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Admin</h2>
        <Link href="/admin/orders" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-indigo-900/30 hover:text-indigo-300 transition-all">
          <LayoutDashboard className="w-4 h-4" />
          <span className="font-medium">OMS Dashboard</span>
        </Link>
        <Link href="/admin/rules" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-indigo-900/30 hover:text-indigo-300 transition-all">
          <Settings className="w-4 h-4" />
          <span className="font-medium">FSM Rules</span>
        </Link>
      </div>
    </aside>
  );
}
