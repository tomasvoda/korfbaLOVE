import { Clock, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Trash2, Send, Shield, Zap, Calendar, ExternalLink, ChevronRight } from 'lucide-react'

export function LicenceCard({ licence, stats, onClick, jeAdmin, canEdit, onRequest, onRenew, onDelete }) {
    const today = new Date()
    const platnostDate = licence.platnost_do ? new Date(licence.platnost_do) : null
    const jePlatna = platnostDate && platnostDate > today
    const barva = licence.typ_role === 'Trenér' ? 'blue' : 'red'

    const dateFmt = (d) => d ? new Date(d).toLocaleDateString('cs-CZ') : '??'

    // --- KPI & PROGRES ---
    const percentCurrent = stats.req > 0 ? Math.min(100, (stats.current / stats.req) * 100) : 0
    const percentProjected = stats.req > 0 ? Math.min(100, (stats.projected / stats.req) * 100) : 0
    const isFulfilled = percentProjected >= 100

    // --- DNÍ DO EXPIRACE ---
    let daysLeftText = null
    let statusTheme = jePlatna ? 'green' : 'red'

    if (jePlatna && platnostDate) {
        const diffDays = Math.ceil(Math.abs(platnostDate - today) / (1000 * 60 * 60 * 24))
        daysLeftText = `${diffDays} dní`
        if (diffDays < 60) statusTheme = 'orange'
    } else if (!jePlatna) {
        daysLeftText = "Expirovalo"
    }

    return (
        <div
            onClick={onClick}
            className="group relative glass-panel rounded-[24px] overflow-hidden cursor-pointer hover:bg-white/[0.06] transition-all active:scale-[0.98] border border-white/[0.1] hover:border-white/[0.2] shadow-2xl"
        >
            {/* Glass Shine Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.05] pointer-events-none"></div>

            {/* 1. SYSTEM BAR (Ultra-Thin) */}
            <div className="px-3 py-1.5 bg-white/[0.04] border-b border-white/[0.08] flex justify-between items-center relative z-10">
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${jePlatna ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'} animate-pulse`}></div>
                    <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase">LIC_{String(licence.id).slice(0, 5)}</span>
                </div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/[0.05] border border-white/10">
                    <Shield className={`w-2 h-2 ${barva === 'blue' ? 'text-blue-400' : 'text-red-400'}`} />
                    <span className="text-[7px] font-black text-slate-400 uppercase">{licence.typ_role}</span>
                </div>
            </div>

            <div className="p-4 md:p-5 space-y-3.5 relative z-10">
                {/* 2. COMPACT HEADER (Rank + Title) */}
                <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3.5">
                        {/* Rank Circle */}
                        <div className="relative shrink-0">
                            <div className={`absolute inset-0 bg-${barva}-500/20 blur-lg rounded-full`}></div>
                            <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br from-${barva}-500/25 to-white/5 border border-white/10 flex items-center justify-center shadow-inner`}>
                                <span className={`text-2xl font-black ${barva === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
                                    {licence.uroven}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-base font-black text-white leading-tight tracking-tight">
                                {licence.typ_role} {licence.uroven}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded bg-${statusTheme}-500/10 text-${statusTheme}-400 border border-${statusTheme}-500/20`}>
                                    {jePlatna ? 'PLATNÁ' : 'EXPIROVANÁ'}
                                </span>
                                {isFulfilled && (
                                    <span className="relative flex items-center gap-1 text-[8px] font-black bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 overflow-hidden">
                                        <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-[shimmer_2s_infinite]"></div>
                                        <CheckCircle className="w-2 h-2" /> SPLNĚNO
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Expiration Badge */}
                    <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-inner text-center min-w-[70px]">
                        <div className="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-0.5">PLATNOST</div>
                        <div className={`text-[10px] font-bold ${!jePlatna ? 'text-red-400' : 'text-white'}`}>
                            {dateFmt(licence.platnost_do)}
                        </div>
                    </div>
                </div>

                {/* 3. COMPACT KPI SECTION */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] shadow-inner">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-black text-white">{stats.current}</span>
                            <span className="text-[10px] text-slate-500 font-bold">/ {stats.req} kreditů</span>
                        </div>
                        {!isFulfilled && (
                            <span className="text-[9px] font-bold text-blue-400/80">
                                +{stats.projected - stats.current} plánováno
                            </span>
                        )}
                    </div>

                    {/* Liquid Progress Bar */}
                    <div className="relative h-2 w-full bg-black/40 rounded-full border border-white/5 overflow-hidden p-[1px]">
                        {/* Projected (Ghost) */}
                        <div
                            className="absolute top-[1px] left-[1px] h-[calc(100%-2px)] bg-white/10 rounded-full transition-all duration-1000"
                            style={{ width: `calc(${percentProjected}% - 2px)` }}
                        ></div>
                        {/* Current */}
                        <div
                            className={`absolute top-[1px] left-[1px] h-[calc(100%-2px)] rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(59,130,246,0.3)] ${isFulfilled ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                                barva === 'blue' ? 'bg-gradient-to-r from-blue-600 to-blue-400' : 'bg-gradient-to-r from-red-600 to-red-400'
                                }`}
                            style={{ width: `calc(${percentCurrent}% - 2px)` }}
                        >
                            <div className="absolute inset-0 bg-white/20 blur-[1px] opacity-40 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* 4. ACTIONS (Streamlined) */}
                <div className="flex justify-between items-center pt-1">
                    <div className={`flex items-center gap-1.5 text-[9px] font-black ${statusTheme === 'red' ? 'text-red-400' : statusTheme === 'orange' ? 'text-orange-400' : 'text-slate-500'}`}>
                        <Clock className="w-2.5 h-2.5 opacity-60" />
                        {daysLeftText}
                    </div>

                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        {jeAdmin ? (
                            <div className="flex gap-1">
                                <button onClick={() => onRenew(licence)} className="p-1.5 hover:bg-blue-500/20 text-slate-500 hover:text-blue-400 rounded-lg transition-all" title="Prodloužit"><RefreshCw className="w-3.5 h-3.5" /></button>
                                <button onClick={() => onDelete(licence.id)} className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-all" title="Smazat"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        ) : canEdit && (
                            licence.zadost_o_prodlouzeni ? (
                                <span className="text-[9px] font-black text-orange-400 bg-orange-500/5 px-2 py-1 rounded-full border border-orange-500/20">ČEKÁ</span>
                            ) : (
                                <button onClick={() => onRequest(licence.id)} className="text-[9px] font-black bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-full transition-all shadow-lg active:scale-95">PRODLOUŽIT</button>
                            )
                        )}
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                    </div>
                </div>
            </div>
        </div>
    )
}