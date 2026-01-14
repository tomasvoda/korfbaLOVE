import React from 'react';
import { Crown } from 'lucide-react';

export const UserManagement = ({ users, onToggleAdmin }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Seznam uživatelů</h2>
                <div className="bg-white/5 px-2 py-0.5 rounded text-xs text-slate-400 font-mono">{users.length}</div>
            </div>
            <div className="glass-panel rounded-xl overflow-hidden border border-white/5 bg-[#0f172a]/50">
                <div className="divide-y divide-white/5">
                    {users.map(u => (
                        <div key={u.id} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden font-bold text-white text-xs border border-white/10 shrink-0">
                                    {u.foto_url ? <img src={u.foto_url} className="w-full h-full object-cover" /> : u.jmeno?.[0]}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-white text-sm truncate flex items-center gap-2">
                                        {u.prijmeni} {u.jmeno}
                                        {u.role === 'admin' && <Crown className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate flex items-center gap-2">
                                        <span>{u.email}</span>
                                        <span className="text-slate-700">•</span>
                                        <span>{u.last_activity ? new Date(u.last_activity).toLocaleDateString() : '-'}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => onToggleAdmin(u.id, u.role)}
                                className={`px-2 py-1 rounded text-[10px] font-bold border transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 ${u.role === 'admin'
                                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'
                                    }`}
                            >
                                {u.role === 'admin' ? 'ODEBRAT' : 'JMENOVAT'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
