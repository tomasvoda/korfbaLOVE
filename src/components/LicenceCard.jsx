import { CheckCircle, AlertTriangle, ChevronRight, TrendingUp, Send, RefreshCw, Trash2, Download, Clock, AlertCircle } from 'lucide-react'

// PŘIDAL JSEM PROP 'canEdit'
export function LicenceCard({ licence, stats, onClick, jeAdmin, canEdit, onRequest, onRenew, onDelete }) {
    const today = new Date()
    const platnostDate = licence.platnost_do ? new Date(licence.platnost_do) : null
    const jePlatna = platnostDate && platnostDate > today
    const barva = licence.typ_role === 'Trenér' ? 'blue' : 'red'
    
    const dateFmt = (d) => d ? new Date(d).toLocaleDateString('cs-CZ') : '??'
    const percent = stats.req > 0 ? Math.min(100, (stats.projected / stats.req) * 100) : 0
    const progressColor = percent >= 100 ? 'bg-green-500' : percent >= 50 ? 'bg-orange-500' : 'bg-red-500'
    const showStats = stats.req > 0

    // Výpočet dní... (beze změny)
    let daysLeftText = null
    let daysLeftColor = "text-slate-500"
    if (jePlatna && platnostDate) {
        const diffTime = Math.abs(platnostDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays < 60) { daysLeftText = `Expiruje za ${diffDays} dní`; daysLeftColor = "text-red-400 font-bold" }
        else if (diffDays < 180) { daysLeftText = `Zbývá ${diffDays} dní`; daysLeftColor = "text-orange-400" }
        else { daysLeftText = `Zbývá ${diffDays} dní` }
    } else if (!jePlatna) { daysLeftText = "Platnost vypršela"; daysLeftColor = "text-red-500 font-bold uppercase text-[10px]" }

    return (
        <div onClick={onClick} className="relative group glass-panel rounded-2xl overflow-hidden cursor-pointer hover:bg-white/5 transition-all active:scale-[0.98] border border-white/5 hover:border-white/10">
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-${barva}-500 transition-all group-hover:w-2`}></div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 group-hover:opacity-100 transition-opacity text-slate-500 pointer-events-none"><ChevronRight className="w-5 h-5"/></div>

            <div className="pt-4 pb-3 pl-5 pr-8 flex flex-col gap-3">
                {/* HLAVIČKA */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className={`text-3xl font-black text-${barva}-500 leading-none`}>{licence.uroven}</span>
                        <div className="h-6 w-px bg-white/10"></div>
                        <div className="flex flex-col"><span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-0.5">Role</span><span className="text-sm font-bold text-white leading-none">{licence.typ_role}</span></div>
                    </div>
                    {jePlatna ? <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20"><CheckCircle className="w-3 h-3"/> AKTIVNÍ</span> : <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-lg border border-red-500/20"><AlertTriangle className="w-3 h-3"/> NEAKTIVNÍ</span>}
                </div>

                {/* DATUMY */}
                <div className="flex justify-between items-center w-full relative py-1">
                    <div className="flex flex-col"><span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">Získáno</span><span className="text-xs text-slate-400 font-medium">{dateFmt(licence.datum_ziskani)}</span></div>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent mx-4"></div>
                    <div className="flex flex-col items-end"><span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">Platnost do</span><span className={`text-xs font-medium ${jePlatna ? "text-slate-300" : "text-red-400 font-bold"}`}>{dateFmt(licence.platnost_do)}</span></div>
                </div>

                {/* SPODNÍ ČÁST - ZOBRAZUJEME JEN POKUD JE ADMIN NEBO VLASTNÍK (canEdit) */}
                <div className="mt-1 pt-3 border-t border-white/5 flex flex-col gap-3">
                    {showStats && (
                        <div>
                            <div className="flex justify-between items-end mb-2 text-xs">
                                <div className="flex items-center gap-1.5 text-blue-300"><TrendingUp className="w-3.5 h-3.5"/><span className="font-bold">{stats.current}</span><span className="text-[10px] text-slate-500 font-normal">aktuálně</span></div>
                                <div className="text-slate-400">Předpoklad: <span className={stats.projected >= stats.req ? "text-green-400 font-bold" : "text-white"}>{stats.projected}</span><span className="text-slate-600"> / {stats.req}</span></div>
                            </div>
                            <div className="h-1.5 w-full bg-slate-700/30 rounded-full overflow-hidden"><div className={`h-full ${progressColor} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]`} style={{ width: `${percent}%` }}></div></div>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-1 min-h-[28px]">
                        <div className={`flex items-center gap-1.5 text-[11px] font-medium ${daysLeftColor}`}>{!jePlatna ? <AlertCircle className="w-3 h-3"/> : <Clock className="w-3 h-3 opacity-50"/>}{daysLeftText}</div>
                        
                        <div className="flex gap-2 relative z-20">
                            {/* ADMIN AKCE */}
                            {jeAdmin && (
                                <>
                                    <button onClick={(e) => { e.stopPropagation(); onRenew(licence); }} className="flex items-center gap-1.5 text-[10px] font-bold bg-white/5 hover:bg-blue-600 hover:text-white text-slate-300 px-2 py-1.5 rounded-lg transition-all border border-white/10"><RefreshCw className="w-3 h-3"/> Prodloužit</button>
                                    <button onClick={(e) => { e.stopPropagation(); onDelete(licence.id); }} className="flex items-center gap-1.5 text-[10px] font-bold bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 px-2 py-1.5 rounded-lg transition-all border border-red-500/10"><Trash2 className="w-3 h-3"/></button>
                                </>
                            )}
                            
                            {/* UŽIVATEL AKCE - JEN POKUD MÁ OPRÁVNĚNÍ (canEdit) A NENÍ ADMIN */}
                            {!jeAdmin && canEdit && (
                                licence.zadost_o_prodlouzeni ? (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1.5 rounded-lg border border-yellow-500/20"><Clock className="w-3 h-3"/> Žádost odeslána</div>
                                ) : (
                                    <button onClick={(e) => { e.stopPropagation(); onRequest(licence.id); }} className="flex items-center gap-2 text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-blue-900/20"><Send className="w-3 h-3"/> Požádat o prodloužení</button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}