'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

export default function AdminRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [opToken, setOpToken] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState({ source_state: '', action: '', target_state: '', description: '' });

  useEffect(() => {
    const login = async () => {
      const res = await fetch('http://127.0.0.1:8000/api/auth/operator/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@techstore.com', password: 'Admin@1234' })
      });
      if (res.ok) { const d = await res.json(); setOpToken(d.access_token); fetchRules(d.access_token); }
    };
    login();
  }, []);

  const fetchRules = async (token: string) => {
    const r = await fetch('http://127.0.0.1:8000/api/admin/rules', { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setRules(await r.json());
  };

  const deleteRule = async (id: number) => {
    await fetch(`http://127.0.0.1:8000/api/admin/rules/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${opToken}` } });
    fetchRules(opToken);
  };

  const addRule = async () => {
    const params = new URLSearchParams(newRule);
    await fetch(`http://127.0.0.1:8000/api/admin/rules?${params}`, { method: 'POST', headers: { Authorization: `Bearer ${opToken}` } });
    setShowAdd(false);
    setNewRule({ source_state: '', action: '', target_state: '', description: '' });
    fetchRules(opToken);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">FSM Rule Builder (DFA)</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
          <Plus className="h-4 w-4" /> Add Rule
        </button>
      </div>

      {showAdd && (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={newRule.source_state} onChange={e => setNewRule({...newRule, source_state: e.target.value})} placeholder="Source State (e.g. Placed)" className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-sm" />
            <input value={newRule.action} onChange={e => setNewRule({...newRule, action: e.target.value})} placeholder="Action (e.g. process)" className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-sm" />
            <input value={newRule.target_state} onChange={e => setNewRule({...newRule, target_state: e.target.value})} placeholder="Target State (e.g. Processing)" className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-sm" />
            <input value={newRule.description} onChange={e => setNewRule({...newRule, description: e.target.value})} placeholder="Description" className="bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white text-sm" />
          </div>
          <button onClick={addRule} className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all">Save Rule</button>
        </div>
      )}

      <div className="space-y-2">
        {rules.map((r: any) => (
          <div key={r.id} className="flex items-center gap-4 bg-gray-800/30 border border-gray-800/50 rounded-xl p-4 group hover:border-gray-700/50 transition-all">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="bg-blue-900/40 text-blue-400 border border-blue-800/30 px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap">{r.source_state}</span>
              <ArrowRight className="h-4 w-4 text-gray-600 flex-shrink-0" />
              <span className="bg-indigo-900/40 text-indigo-400 px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap">{r.action}</span>
              <ArrowRight className="h-4 w-4 text-gray-600 flex-shrink-0" />
              <span className="bg-green-900/40 text-green-400 border border-green-800/30 px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap">{r.target_state}</span>
            </div>
            <span className="text-xs text-gray-500 hidden lg:block flex-1 truncate">{r.description}</span>
            <button onClick={() => deleteRule(r.id)} className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
