'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { LifeBuoy, Plus, MessageCircle } from 'lucide-react';

export default function SupportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '', category: 'general' });

  useEffect(() => {
    if (!user) { router.push('/login?redirect=/support'); return; }
    fetch('http://127.0.0.1:8000/api/support/tickets/me', { headers: { Authorization: `Bearer ${user.token}` } })
      .then(r => r.ok ? r.json() : []).then(setTickets);
  }, [user, router]);

  const submit = async () => {
    await fetch('http://127.0.0.1:8000/api/support/tickets', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
      body: JSON.stringify(form)
    });
    setShowForm(false);
    setForm({ subject: '', description: '', category: 'general' });
    const r = await fetch('http://127.0.0.1:8000/api/support/tickets/me', { headers: { Authorization: `Bearer ${user?.token}` } });
    if (r.ok) setTickets(await r.json());
  };

  if (!user) return null;
  const statusColors: Record<string, string> = { Open: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30', 'In Review': 'text-blue-400 bg-blue-400/10 border-blue-500/30', Resolved: 'text-green-400 bg-green-400/10 border-green-500/30' };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LifeBuoy className="h-6 w-6 text-green-400" />
          <h1 className="text-3xl font-bold text-white">Support Center</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
          <Plus className="h-4 w-4" /> New Ticket
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Create Support Ticket</h2>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500">
            <option value="general">General Inquiry</option><option value="damaged">Damaged Item</option>
            <option value="wrong_item">Wrong Item</option><option value="not_received">Not Received</option>
            <option value="refund">Refund Request</option>
          </select>
          <input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Subject"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500" />
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe your issue..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-blue-500 h-28 resize-none" />
          <button onClick={submit} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all">Submit Ticket</button>
        </div>
      )}

      <div className="space-y-3">
        {tickets.map((t: any) => (
          <div key={t.id} className="bg-gray-900/40 border border-gray-800/50 rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{t.subject}</h3>
                <p className="text-xs text-gray-500 mt-1">#{t.id} - {t.category} - {new Date(t.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[t.status] || 'text-gray-400 bg-gray-800 border-gray-700'}`}>{t.status}</span>
            </div>
            <p className="text-sm text-gray-400">{t.description}</p>
            {t.admin_response && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 flex gap-2">
                <MessageCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div><p className="text-xs text-blue-400 font-semibold mb-1">Admin Response</p><p className="text-sm text-gray-300">{t.admin_response}</p></div>
              </div>
            )}
          </div>
        ))}
        {tickets.length === 0 && <div className="text-center py-12 text-gray-500">No support tickets yet.</div>}
      </div>
    </div>
  );
}
