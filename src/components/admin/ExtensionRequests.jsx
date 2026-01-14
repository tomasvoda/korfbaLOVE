import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Clock, ArrowRight } from 'lucide-react';

export const ExtensionRequests = ({ requests }) => {
    if (requests.length === 0) {
        return (
            <div className="py-12 rounded-2xl border border-dashed border-white/10 text-center bg-white/5 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600"><Clock className="w-6 h-6" /></div>
                <div className="text-slate-500 text-sm">Žádné žádosti o prodloužení.</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-white mb-2">Žádosti o prodloužení</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {requests.map(req => (
                    <Link key={req.id} to={`/osoba/${req.osoby?.id}`} className="glass-panel p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-all border border-yellow-500/20 hover:border-yellow-500/50 group">
                        <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-white/10 relative z-10">
                            {req.osoby?.foto_url ? <img src={req.osoby.foto_url} className="w-full h-full object-cover" /> : <span className="font-bold text-white text-sm">{req.osoby?.jmeno?.[0]}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-white text-sm truncate">{req.osoby?.prijmeni} {req.osoby?.jmeno}</div>
                            <div className="text-xs text-yellow-400 font-bold uppercase flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {req.typ_role} {req.uroven}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-yellow-400 transition-colors" />
                    </Link>
                ))}
            </div>
        </div>
    );
};
