'use client';
import { useEffect, useState } from 'react';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [opToken, setOpToken] = useState('');
  const [response, setResponse] = useState('');
  const [activeTicket, setActiveTicket] = useState<number | null>(null);

  useEffect(() => {
    const login = async () => {
      const res = await fetch('http://127.0.0.1:8000/api/auth/operator/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@techstore.com', password: 'Admin@1234' })
      });
      if (res.ok) {
        const d = await res.json();
        setOpToken(d.access_token);
        fetchTickets(d.access_token);
      }
    };
    login();
  }, []);

  const fetchTickets = async (token: string) => {
    const r = await fetch('http://127.0.0.1:8000/api/support/tickets', { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setTickets(await r.json());
  };

  const resolve = async (id: number) => {
    await fetch(`http://127.0.0.1:8000/api/support/tickets/${id}/resolve`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opToken}` },
      body: JSON.stringify({ admin_response: response, status: 'Resolved' })
    });
    setResponse('');
    setActiveTicket(null);
    fetchTickets(opToken);
  };

  const statusColors: Record<string, string> = { Open: 'text-yellow-400 bg-yellow-400/10', 'In Review': 'text-blue-400 bg-blue-400/10', Resolved: 'text-green-400 bg-green-400/10' };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
      <div className="space-y-3">
        {tickets.map((t: any) => (
          <div key={t.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-white">{t.subject}</h3>
                <p className="text-xs text-gray-500">#{t.id} | {t.category} | Customer #{t.customer_id} | {new Date(t.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[t.status] || 'text-gray-400 bg-gray-800'}`}>{t.status}</span>
            </div>
            <p className="text-sm text-gray-400">{t.description}</p>
            {t.status !== 'Resolved' && (
              activeTicket === t.id ? (
                <div className="space-y-2">
                  <textarea value={response} onChange={e => setResponse(e.target.value)} placeholder="Type your response..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-sm h-20 resize-none focus:outline-none focus:border-blue-500" />
                  <div className="flex gap-2">
                    <button onClick={() => resolve(t.id)} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">Resolve</button>
                    <button onClick={() => setActiveTicket(null)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-all">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setActiveTicket(t.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">Respond</button>
              )
            )}
            {t.admin_response && <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 text-sm text-gray-300"><span className="text-green-400 font-semibold">Response: </span>{t.admin_response}</div>}
          </div>
        ))}
        {tickets.length === 0 && <div className="text-center py-12 text-gray-500">No support tickets.</div>}
      </div>
    </div>
  );
}
