import { Clock, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Trash2, Send, AlertCircle, ChevronRight } from 'lucide-react'

export function LicenceCard({ licence, stats, onClick, jeAdmin, canEdit, onRequest, onRenew, onDelete }) {
    const today = new Date()
    const platnostDate = licence.platnost_do ? new Date(licence.platnost_do) : null
    const jePlatna = platnostDate && platnostDate > today
    const barva = licence.typ_role === 'Trenér' ? 'blue' : 'red'

    const dateFmt = (d) => d ? new Date(d).toLocaleDateString('cs-CZ') : '??'

    // --- VÝPOČET PROGRESU ---
    const percentCurrent = stats.req > 0 ? Math.min(100, (stats.current / stats.req) * 100) : 0
    const percentProjected = stats.req > 0 ? Math.min(100, (stats.projected / stats.req) * 100) : 0

    // Barvy
    const progressColor = percentCurrent >= 100 ? 'bg-green-500' : percentCurrent >= 50 ? 'bg-orange-500' : 'bg-red-500'
    const ghostColor = percentProjected >= 100 ? 'bg-green-400/30' : 'bg-white/10'

    const showStats = stats.req > 0

    // --- VÝPOČET DNÍ DO EXPIRACE ---
    let daysLeftText = null
    let daysLeftColor = "text-slate-500"
    if (jePlatna && platnostDate) {
        const diffTime = Math.abs(platnostDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 60) { daysLeftText = `${diffDays} dní`; daysLeftColor = "text-red-400 font-bold" }
        else { daysLeftText = `${diffDays} dní` }
    } else if (!jePlatna) { daysLeftText = "Expirovalo"; daysLeftColor = "text-red-500 font-bold uppercase text-[10px]" }

    return (
        <div onClick={onClick} className="relative group glass-panel rounded-xl overflow-hidden cursor-pointer hover:bg-white/5 transition-all active:scale-[0.99] border border-white/5 hover:border-white/10 shadow-sm">
            {/* Tenký barevný proužek nahoře */}
            <div className={`h-1 w-full bg-${barva}-500 opacity-80`}></div>

            <div className="p-4 flex flex-col gap-3">
                {/* HLAVIČKA: Úroveň vlevo, Role a Status vpravo */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        {/* Úroveň (Velké písmeno) */}
                        <div className={`w-10 h-10 rounded-lg bg-${barva}-500/10 border border-${barva}-500/20 flex items-center justify-center text-xl font-black text-${barva}-400`}>
                            {licence.uroven}
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">{licence.typ_role}</div>
                            <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${jePlatna ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {jePlatna ? 'AKTIVNÍ' : 'NEAKTIVNÍ'}
                            </div>
                        </div>
                    </div>
                    {/* Expirace vpravo nahoře */}
                    <div className="text-right">
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wide mb-0.5">Platí do</div>
                        <div className={`text-sm font-mono font-medium ${!jePlatna ? 'text-red-400 line-through' : 'text-slate-200'}`}>
                            {dateFmt(licence.platnost_do)}
                        </div>
                    </div>
                </div>

                {/* PROGRES BAR (Tenký a elegantní) */}
                {showStats && (
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-end text-[10px] font-medium text-slate-400">
                            <span>Kredity</span>
                            <span><span className="text-white font-bold">{stats.current}</span> / {stats.req}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-700/30 rounded-full overflow-hidden relative">
                            <div className={`absolute top-0 left-0 h-full ${ghostColor} transition-all duration-1000 ease-out`} style={{ width: `${percentProjected}%` }}></div>
                            <div className={`absolute top-0 left-0 h-full ${progressColor} transition-all duration-1000 ease-out`} style={{ width: `${percentCurrent}%` }}></div>
                        </div>
                    </div>
                )}

                {/* SPODNÍ LIŠTA: Dny a Tlačítka */}
                <div className="pt-2 mt-1 border-t border-white/5 flex justify-between items-center">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${daysLeftColor}`}>
                        <Clock className="w-3 h-3 opacity-70" /> {daysLeftText}
                    </div>

                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {jeAdmin && (
                            <>
                                <button onClick={() => onRenew(licence)} className="p-1.5 bg-white/5 hover:bg-blue-600 hover:text-white rounded-md transition-colors text-slate-400" title="Prodloužit"><RefreshCw className="w-3.5 h-3.5" /></button>
                                <button onClick={() => onDelete(licence.id)} className="p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-md transition-colors text-red-400" title="Smazat"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                        )}
                        {!jeAdmin && canEdit && !licence.zadost_o_prodlouzeni && (
                            <button onClick={() => onRequest(licence.id)} className="flex items-center gap-1.5 text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded-md transition-colors shadow-sm">
                                <Send className="w-3 h-3" /> Prodloužit
                            </button>
                        )}
                        {!jeAdmin && canEdit && licence.zadost_o_prodlouzeni && (
                            <span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 font-bold">Žádost odeslána</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}