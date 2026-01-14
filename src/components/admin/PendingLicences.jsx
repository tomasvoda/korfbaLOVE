import React from 'react';
import { CheckCircle, XCircle, FileText, Clock } from 'lucide-react';

export const PendingLicences = ({ licences, onApprove, onReject, onShowHistory }) => {
    if (licences.length === 0) {
        return (
            <div className="py-12 rounded-2xl border border-dashed border-white/10 text-center bg-white/5 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600"><CheckCircle className="w-6 h-6" /></div>
                <div className="text-slate-500 text-sm">Žádné nové licence ke schválení.</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-white">Nové licence</h2>
                <button onClick={onShowHistory} className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
                    <Clock className="w-3 h-3" /> Historie
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {licences.map(lic => (
                    <div key={lic.id} className="glass-panel p-4 rounded-xl border border-green-500/20 bg-green-500/5 hover:border-green-500/40 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
                                {lic.osoby?.foto_url ? <img src={lic.osoby.foto_url} className="w-full h-full object-cover" /> : <span className="font-bold text-white text-sm">{lic.osoby?.jmeno?.[0]}</span>}
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-white text-sm truncate">{lic.osoby?.prijmeni} {lic.osoby?.jmeno}</div>
                                <div className="text-xs text-green-400 font-bold uppercase">Žádost: {lic.typ_role} {lic.uroven}</div>
                            </div>
                        </div>

                        <div className="flex gap-2 text-xs text-slate-400 mb-4 bg-black/20 p-2 rounded-lg border border-white/5">
                            <span>Ze dne: {new Date(lic.datum_ziskani).toLocaleDateString()}</span>
                            {lic.certifikat_url && (<><span className="text-slate-600">|</span><a href={lic.certifikat_url} target="_blank" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold"><FileText className="w-3 h-3" /> Certifikát</a></>)}
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => onApprove(lic.id)} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-lg transition-all"><CheckCircle className="w-3 h-3" /> Schválit</button>
                            <button onClick={() => onReject(lic.id)} className="px-3 bg-slate-800 hover:bg-red-900/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-white/5"><XCircle className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
