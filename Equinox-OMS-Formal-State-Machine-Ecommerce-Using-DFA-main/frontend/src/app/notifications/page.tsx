'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetch('http://127.0.0.1:8000/api/notifications/', { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.ok ? r.json() : []).then(setNotifs);
  }, [user, router]);

  const markAllRead = async () => {
    await fetch('http://127.0.0.1:8000/api/notifications/mark-all-read', { method: 'POST', headers: { Authorization: `Bearer ${user?.token}` } });
    setNotifs(notifs.map(n => ({ ...n, is_read: true })));
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
        </div>
        <button onClick={markAllRead} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
          <CheckCheck className="h-4 w-4" /> Mark all read
        </button>
      </div>
      <div className="space-y-2">
        {notifs.map((n: any) => (
          <div key={n.id} className={`p-4 rounded-xl border transition-all ${n.is_read ? 'bg-gray-900/30 border-gray-800/40 opacity-60' : 'bg-gray-900/60 border-gray-700/50'}`}>
            <h3 className="font-semibold text-white text-sm">{n.title}</h3>
            {n.body && <p className="text-xs text-gray-400 mt-1">{n.body}</p>}
            <p className="text-[10px] text-gray-600 mt-2">{new Date(n.created_at).toLocaleString()}</p>
          </div>
        ))}
        {notifs.length === 0 && <div className="text-center py-12 text-gray-500">No notifications.</div>}
      </div>
    </div>
  );
}
