import React from 'react';
import { Clock, MapPin, Edit2, Trash2, Dumbbell, Trophy, BookOpen } from 'lucide-react';

export const LicenceActivityCard = ({ akt, isAdmin, onEdit, onDelete }) => {
    const isTraining = !akt.typ_aktivity || akt.typ_aktivity === 'trenink';
    const isCollision = akt._status === 'collision';
    const isDuplicate = akt._status === 'duplicate';

    const safeDate = (d) => {
        if (!d) return '??';
        const date = new Date(d);
        return isNaN(date.getTime()) ? '??' : date.toLocaleDateString('cs-CZ');
    };

    return (
        <div className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all group relative bg-slate-800/20 hover:bg-slate-800/40">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="text-lg font-black text-white leading-tight">{akt.kategorie}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                        {akt.typ_aktivity === 'seminar' ? (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <BookOpen className="w-3 h-3" /> Seminář
                            </span>
                        ) : (
                            <>
                                {isTraining ? <Dumbbell className="w-3 h-3 text-blue-400" /> : <Trophy className="w-3 h-3 text-yellow-400" />}
                                <span className="truncate max-w-[150px]">
                                    {akt.nazev || (isTraining ? 'Trénink' : 'Zápas/Akce')}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-xl font-bold ${isCollision || isDuplicate ? 'text-slate-600' : 'text-purple-400'}`}>{akt.celkem_kreditu}</div>
                    <div className="text-[10px] text-slate-600 uppercase font-bold">Kr.</div>
                </div>
            </div>
            <div className="space-y-2 text-sm text-slate-300 mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 relative">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono text-xs">{akt.datum_od === akt.datum_do ? safeDate(akt.datum_od) : `${safeDate(akt.datum_od)} - ${safeDate(akt.datum_do)}`}</span>
                    {(isCollision) && <span className="text-[9px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded ml-auto font-bold uppercase">Krytí</span>}
                    {(isDuplicate) && <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded ml-auto font-bold uppercase">Duplicita</span>}
                </div>
                {akt.lokace && <div className="flex items-center gap-2 truncate text-xs text-slate-400"><MapPin className="w-3.5 h-3.5 text-slate-600" /> {akt.lokace}</div>}
            </div>

            {isAdmin && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={() => onEdit(akt)} className="p-1.5 bg-slate-900 rounded-md text-slate-400 hover:text-white border border-white/10"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onDelete(akt.id, akt._source)} className="p-1.5 bg-slate-900 rounded-md text-red-400 hover:bg-red-900/20 hover:text-red-300 border border-white/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
            )}
        </div>
    );
};
