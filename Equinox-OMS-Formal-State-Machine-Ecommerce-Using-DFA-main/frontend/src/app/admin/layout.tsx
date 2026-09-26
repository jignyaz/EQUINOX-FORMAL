import Link from 'next/link';
import { Package, Settings, LifeBuoy, BarChart3 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[600px] flex-col md:flex-row gap-6">
      <aside className="w-full md:w-56 flex-shrink-0">
        <nav className="flex flex-col space-y-1 bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 p-3 rounded-xl shadow-lg">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 py-2">Operator Portal</div>
          <Link href="/admin/orders" className="flex items-center gap-3 p-3 hover:bg-gray-800/60 rounded-lg text-gray-300 hover:text-white transition-all text-sm">
            <Package className="h-4 w-4" /> Orders (OMS)
          </Link>
          <Link href="/admin/rules" className="flex items-center gap-3 p-3 hover:bg-gray-800/60 rounded-lg text-gray-300 hover:text-white transition-all text-sm">
            <Settings className="h-4 w-4" /> FSM Rules
          </Link>
          <Link href="/admin/tickets" className="flex items-center gap-3 p-3 hover:bg-gray-800/60 rounded-lg text-gray-300 hover:text-white transition-all text-sm">
            <LifeBuoy className="h-4 w-4" /> Support Tickets
          </Link>
        </nav>
      </aside>
      <main className="flex-1 bg-gray-900/30 border border-gray-800/50 p-6 rounded-xl overflow-hidden shadow-lg backdrop-blur-sm">
        {children}
      </main>
    </div>
  );
}
