'use client';
import Link from "next/link";
import { Star, ShoppingCart, User, Bell, Search, LogOut, Package, LifeBuoy } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { items } = useCart();
  const { user, logout } = useAuth();
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [notifCount, setNotifCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (user?.token) {
      fetch('http://127.0.0.1:8000/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${user.token}` }
      }).then(r => r.ok ? r.json() : { count: 0 }).then(d => setNotifCount(d.count)).catch(() => {});
    }
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/category/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800/60 bg-black/70 backdrop-blur-xl">
      <div className="flex h-16 items-center px-4 md:px-6 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/30">T</div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent hidden sm:block">Equinox OMS</span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl bg-gray-900/80 border border-gray-800 pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>
        </form>

        {/* Right Actions */}
        <div className="ml-auto flex items-center gap-1">
          {user && (
            <>
              <Link href="/wishlist" className="p-2 text-gray-400 hover:text-pink-400 transition-colors rounded-lg hover:bg-gray-800/50" title="Wishlist">
                <Star className="h-5 w-5" />
              </Link>
              <Link href="/notifications" className="relative p-2 text-gray-400 hover:text-yellow-400 transition-colors rounded-lg hover:bg-gray-800/50" title="Notifications">
                <Bell className="h-5 w-5" />
                {notifCount > 0 && <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">{notifCount}</span>}
              </Link>
            </>
          )}

          <Link href="/cart" className="relative p-2 text-gray-400 hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-800/50" title="Cart">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-blue-500 text-[10px] font-bold text-white flex items-center justify-center">{cartCount}</span>}
          </Link>

          {user ? (
            <div className="flex items-center gap-1 ml-2">
              <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all" title="My Orders">
                <Package className="h-4 w-4" />
                <span className="hidden lg:block">My Orders</span>
              </Link>
              <Link href="/support" className="p-2 text-gray-400 hover:text-green-400 transition-colors rounded-lg hover:bg-gray-800/50" title="Support">
                <LifeBuoy className="h-5 w-5" />
              </Link>
              <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-800/50" title="Logout">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-2 ml-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-600/20">
              <User className="h-4 w-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
