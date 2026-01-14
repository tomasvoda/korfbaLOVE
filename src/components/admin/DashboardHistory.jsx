import React from 'react';
import { ArrowRight } from 'lucide-react';

export const DashboardHistory = ({ history, onRevoke, onBack }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Historie</h2>
                <button onClick={onBack} className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
                    <ArrowRight className="w-3 h-3 rotate-180" /> Zpět
                </button>
            </div>
            <div className="glass-panel rounded-xl overflow-hidden border border-white/5 bg-[#0f172a]/50">
                <div className="divide-y divide-white/5">
                    {history.map(lic => (
                        <div key={lic.id} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10 shrink-0 text-white text-xs font-bold">{lic.osoby?.jmeno?.[0]}</div>
                                <div>
                                    <div className="font-bold text-white text-sm">{lic.osoby?.prijmeni} {lic.osoby?.jmeno}</div>
                                    <div className="text-xs text-slate-500 font-mono">{lic.typ_role} {lic.uroven} • {new Date(lic.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <button onClick={() => onRevoke(lic.id)} className="px-2 py-1 rounded bg-red-500/5 hover:bg-red-500/20 text-red-500/60 hover:text-red-400 text-[10px] font-bold transition-colors">Odvolat</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
