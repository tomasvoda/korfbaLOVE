import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { ArrowLeft, Clock, MapPin, Edit2, Trash2, Plus, Calendar, Users, Briefcase, Info, Download, Save, X, Minus, TrendingUp, AlertTriangle, CheckCircle, Trophy, Dumbbell, CalendarDays, FileText, HelpCircle } from 'lucide-react'
import { getAktualniSezona, getSezonyList, generovatTerminy, getLimitySezony } from '../utils/dateUtils'
import { calculateLicenseStats, getSeasonFromDate } from '../utils/businessLogic'
import { useAuth } from '../contexts/AuthContext'
import { AddActivityModal } from './AddActivityModal'
import { LicenceProgressBar } from './licence/LicenceProgressBar'
import { LicenceActivityCard } from './licence/LicenceActivityCard'
import { TrainingEditor } from './licence/TrainingEditor'

import { QrCode } from 'lucide-react'

// --- SUBKOMPONENTY ---

const HelpModal = ({ onClose }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
        <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>

            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-blue-400" />
                Jak zadávat aktivity?
            </h3>

            <div className="space-y-6">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-1">Pravidelná činnost (Tréninky)</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Použijte tlačítko <strong className="text-blue-300">Přidat trénink</strong>.
                            Zadáte den v týdnu, čas a období. Systém automaticky vygeneruje všechny tréninkové jednotky pro danou sezónu.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-1">Jednorázové akce</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Použijte tlačítko <strong className="text-white">Přidat zápa</strong> pro vložení zápasů, turnajů, seminářů nebo publikační činnosti.
                            Tyto akce se zadávají jednotlivě s konkrétním datem.
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 text-xs text-blue-200">
                    💡 Kredity se vypočítávají automaticky na základě typu aktivity, délky trvání a vaší role.
                </div>
            </div>

            <button onClick={onClose} className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors">
                Rozumím
            </button>
        </div>
    </div>
)


const safeDate = (d) => {
    if (!d) return '??'
    const date = new Date(d)
    return isNaN(date.getTime()) ? '??' : date.toLocaleDateString('cs-CZ')
}

// --- SUBKOMPONENTY ---
const LicenceHistoryChart = ({ licence }) => {
    const cred23 = licence.kredity_23_24 || 0
    const cred24 = licence.kredity_24_25 || 0
    const max = Math.max(cred23, cred24, 100)

    return (
        <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Historie kreditů</h4>
            <div className="flex items-end gap-6 h-32 px-2">
                {/* 23/24 */}
                <div className="flex-1 flex flex-col justify-end items-center gap-2 group cursor-pointer">
                    <div className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">{cred23}</div>
                    <div className="w-full bg-slate-800 rounded-t-lg relative overflow-hidden group-hover:bg-slate-700 transition-colors" style={{ height: `${(cred23 / max) * 100}%` }}>
                        <div className="absolute inset-x-0 top-0 h-1 bg-blue-500/50"></div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">23/24</div>
                </div>
                {/* 24/25 */}
                <div className="flex-1 flex flex-col justify-end items-center gap-2 group cursor-pointer">
                    <div className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">{cred24}</div>
                    <div className="w-full bg-slate-800 rounded-t-lg relative overflow-hidden group-hover:bg-slate-700 transition-colors" style={{ height: `${(cred24 / max) * 100}%` }}>
                        <div className="absolute inset-x-0 top-0 h-1 bg-green-500/50"></div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">24/25</div>
                </div>
            </div>
        </div>
    )
}



export function DetailLicence({ licence, osobaId, onClose, refreshParent }) {
    const { isAdmin } = useAuth()
    const [cinnosti, setCinnosti] = useState([])
    const [aktivityList, setAktivityList] = useState([])
    const [filtrSezona, setFiltrSezona] = useState(getAktualniSezona().nazev)

    // Editor states
    const [modalCinnost, setModalCinnost] = useState(false)
    const [formCinnost, setFormCinnost] = useState(null)
    const [showAddActivity, setShowAddActivity] = useState(false)
    const [showHelp, setShowHelp] = useState(false)
    const [editingActivity, setEditingActivity] = useState(null)
    const [terminyPreview, setTerminyPreview] = useState([])
    const [ziskaneKredity, setZiskaneKredity] = useState(0)



    useEffect(() => { nacistData() }, [])

    const stats = useMemo(() => calculateLicenseStats(licence, cinnosti, aktivityList), [licence, cinnosti, aktivityList])

    useEffect(() => {
        if (formCinnost?.datum_od && formCinnost?.datum_do) {
            try {
                const prev = generovatTerminy(formCinnost.datum_od, formCinnost.datum_do, formCinnost.den_v_tydnu, formCinnost.vynechane_datumy || [])
                setTerminyPreview(prev)
                setZiskaneKredity(prev.filter(t => t.aktivni).length * (formCinnost.pocet_jednotek || 1))
            } catch (e) { console.error(e) }
        }
    }, [formCinnost])

    const nacistData = async () => {
        const [cinnostiRes, aktivityRes] = await Promise.all([
            supabase.from('cinnosti').select('*').eq('osoba_id', osobaId).order('created_at', { ascending: false }),
            supabase.from('aktivity').select('*').eq('osoba_id', osobaId).order('datum', { ascending: false })
        ])
        if (cinnostiRes.data) setCinnosti(cinnostiRes.data)
        if (aktivityRes.data) setAktivityList(aktivityRes.data)
    }

    const otevritNovou = () => {
        const cur = getAktualniSezona(); const lim = getLimitySezony(cur.nazev)
        setFormCinnost({ id: null, nazev: '', sezona: cur.nazev, role: licence.typ_role, kategorie: 'U11', den_v_tydnu: '1', pocet_jednotek: 1, pocet_sverencu: 10, lokace: '', cas_od: '17:00', cas_do: '18:30', datum_od: lim.start, datum_do: lim.end, vynechane_datumy: [] })
        setModalCinnost(true)
    }

    const otevritEditaci = (akt) => {
        setFormCinnost({ ...akt, den_v_tydnu: String(Array.isArray(akt.den_v_tydnu) ? akt.den_v_tydnu[0] : akt.den_v_tydnu), vynechane_datumy: akt.vynechane_datumy || [] })
        setModalCinnost(true)
    }

    const ulozit = async () => {
        if (!formCinnost.lokace) return toast.error('Chybí lokace')
        const prev = generovatTerminy(formCinnost.datum_od, formCinnost.datum_do, formCinnost.den_v_tydnu, formCinnost.vynechane_datumy)
        const finalKredity = prev.filter(t => t.aktivni).length * (formCinnost.pocet_jednotek || 1)
        const dnyNazvy = ['?', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
        const autoNazev = `${formCinnost.kategorie} - ${dnyNazvy[parseInt(formCinnost.den_v_tydnu)] || '?'}`

        const payload = {
            osoba_id: osobaId, nazev: autoNazev, kategorie: formCinnost.kategorie, lokace: formCinnost.lokace,
            den_v_tydnu: parseInt(formCinnost.den_v_tydnu), cas_od: formCinnost.cas_od, cas_do: formCinnost.cas_do,
            datum_od: formCinnost.datum_od, datum_do: formCinnost.datum_do, sezona: formCinnost.sezona,
            role: formCinnost.role, pocet_jednotek: formCinnost.pocet_jednotek, pocet_sverencu: formCinnost.pocet_sverencu,
            vynechane_datumy: formCinnost.vynechane_datumy, celkem_kreditu: finalKredity
        }

        const { error } = formCinnost.id
            ? await supabase.from('cinnosti').update(payload).eq('id', formCinnost.id)
            : await supabase.from('cinnosti').insert([payload])

        if (error) return toast.error('Chyba při ukládání')

        toast.success('Uloženo')
        setModalCinnost(false)
        await nacistData()
        if (refreshParent) refreshParent()
    }

    const smazat = async (id, source = 'cinnosti') => {
        if (!window.confirm('Opravdu smazat?')) return
        const { error } = await supabase.from(source).delete().eq('id', id)
        if (!error) {
            toast.success('Smazáno')
            await nacistData()
            if (refreshParent) refreshParent()
        }
    }

    const combinedList = useMemo(() => {
        const list = []
        cinnosti.forEach(c => list.push({ ...c, _source: 'cinnosti' }))
        aktivityList.forEach(a => list.push({
            ...a, _source: 'aktivity', kategorie: a.popis,
            nazev: a.typ_aktivity === 'zapas_int' ? 'Mezinárodní' : 'Zápas ČKS',
            celkem_kreditu: a.kredity, datum_od: a.datum, datum_do: a.datum,
            sezona: getSeasonFromDate(a.datum)
        }))

        // Basic collision/duplicate detection for display
        const trainingDays = new Set()
        cinnosti.forEach(c => {
            if (c.role === licence.typ_role) {
                generovatTerminy(c.datum_od, c.datum_do, c.den_v_tydnu, c.vynechane_datumy)
                    .forEach(t => { if (t.aktivni) trainingDays.add(t.datum) })
            }
        })

        const dateWinners = new Map()
        return list.map(item => {
            let status = 'ok'
            if (item._source === 'aktivity') {
                if (trainingDays.has(item.datum_od)) status = 'collision'
                else if (dateWinners.has(item.datum_od)) status = 'duplicate'
                else dateWinners.set(item.datum_od, item.id)
            }
            return { ...item, _status: status }
        })
    }, [cinnosti, aktivityList, licence])

    const sezonyList = useMemo(() => Array.from(new Set(combinedList.map(c => c.sezona).filter(Boolean))).sort((a, b) => b.localeCompare(a)), [combinedList])
    const filtrovane = useMemo(() => {
        const res = (filtrSezona && sezonyList.includes(filtrSezona)) ? combinedList.filter(c => c.sezona === filtrSezona) : combinedList.filter(c => c.sezona === sezonyList[0])
        return [...res].sort((a, b) => new Date(b.datum_od) - new Date(a.datum_od))
    }, [combinedList, filtrSezona, sezonyList])

    const isExpired = Math.ceil((new Date(licence.platnost_do) - new Date()) / (1000 * 60 * 60 * 24)) < 0
    const expiryColor = isExpired ? 'text-red-500' : 'text-green-500'

    if (!licence) return null

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[600px] lg:w-[700px] bg-[#020617] border-l border-white/10 shadow-2xl animate-slideLeft flex flex-col">
            <div className="bg-slate-900/40 backdrop-blur-xl border-b border-white/5 p-4 shrink-0 flex items-center justify-between z-20">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Detail licence</div>
                        <div className="text-lg font-black text-white flex items-center gap-2">
                            {licence.typ_role} <span className="text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded text-sm">{licence.uroven}</span>
                        </div>
                    </div>
                </div>
                {licence.certifikat_url && (
                    <a href={licence.certifikat_url} target="_blank" className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-2 border border-white/5 transition-all">
                        <FileText className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Certifikát</span>
                    </a>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-8">
                    <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                        <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 to-slate-800/50">
                            <div className="flex flex-col md:flex-row gap-8 md:items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CalendarDays className={`w-5 h-5 ${expiryColor}`} />
                                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Časová platnost</span>
                                    </div>
                                    <div className="flex items-center gap-4 w-full max-w-lg">
                                        <div className="text-center">
                                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Získáno</div>
                                            <div className="px-3 py-1 bg-slate-800 rounded-lg text-slate-300 text-sm font-mono border border-white/5">{safeDate(licence.datum_ziskani)}</div>
                                        </div>
                                        <div className="flex-1 h-px bg-gradient-to-r from-slate-700 via-blue-500 to-slate-700 relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Platnost do</div>
                                            <div className={`px-3 py-1 rounded-lg text-sm font-mono border ${isExpired ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-slate-800 border-white/5 text-white'}`}>{safeDate(licence.platnost_do)}</div>
                                        </div>
                                    </div>
                                    {licence.typ_role === 'Trenér' && stats.renewalStart && (
                                        <div className="mt-4 flex items-center gap-2 text-xs bg-blue-500/5 border border-blue-500/10 px-3 py-2 rounded-lg w-fit">
                                            <Info className="w-3.5 h-3.5 text-blue-400" />
                                            <span className="text-slate-400">Období pro sběr kreditů:</span>
                                            <strong className="text-blue-300">{safeDate(stats.renewalStart)} — {safeDate(stats.renewalEnd)}</strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {licence.typ_role === 'Trenér' && (
                            <>
                                <LicenceProgressBar stats={stats} />
                                <div className="mt-6">
                                    <LicenceHistoryChart licence={licence} />
                                </div>
                            </>
                        )}
                    </div>

                    {licence.typ_role === 'Trenér' && (
                        <div className="animate-slideUp">
                            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Briefcase className="w-5 h-5 text-purple-400" /> Činnosti a Zápasy</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowHelp(true)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors" title="Nápověda"><HelpCircle className="w-5 h-5" /></button>
                                    {isAdmin && (
                                        <>
                                            <button onClick={() => setShowAddActivity(true)} className="bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-white/10 transition-all"><Trophy className="w-4 h-4 text-yellow-400" /> Přidat zápas</button>
                                            <button onClick={otevritNovou} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-transform"><Dumbbell className="w-4 h-4" /> Přidat trénink</button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {sezonyList.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
                                    {sezonyList.map(s => (
                                        <button key={s} onClick={() => setFiltrSezona(s)} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${filtrSezona === s ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:text-white'}`}>{s}</button>
                                    ))}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filtrovane.map(akt => (
                                    <LicenceActivityCard key={akt.id} akt={akt} isAdmin={isAdmin} onEdit={akt._source === 'cinnosti' ? otevritEditaci : (a) => { setEditingActivity(a); setShowAddActivity(true) }} onDelete={smazat} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {
                modalCinnost && formCinnost && (
                    <TrainingEditor formCinnost={formCinnost} setFormCinnost={setFormCinnost} onSave={ulozit} onClose={() => setModalCinnost(false)} ziskaneKredity={ziskaneKredity} terminyPreview={terminyPreview} />
                )
            }

            {
                showAddActivity && (
                    <AddActivityModal osobaId={osobaId} initialData={editingActivity} onClose={() => { setShowAddActivity(false); setEditingActivity(null) }}
                        onSave={async () => { await nacistData(); if (refreshParent) refreshParent() }} />
                )
            }

            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        </div >
    )
}
