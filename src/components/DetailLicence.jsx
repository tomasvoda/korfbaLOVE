import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { ArrowLeft, Clock, MapPin, Edit2, Trash2, Plus, Calendar, Users, Briefcase, Info, Download, Save, X, Minus, TrendingUp, AlertTriangle, CheckCircle, Trophy, Dumbbell, CalendarDays, FileText } from 'lucide-react'
import { getAktualniSezona, getSezonyList, generovatTerminy, getLimitySezony, getRenewalPeriod, getLicenseTargets } from '../utils/dateUtils'
import { useAuth } from '../contexts/AuthContext'
import { AddActivityModal } from './AddActivityModal'

// --- HELPERY PRO UI ---
const SectionLabel = ({ icon: Icon, children }) => (<div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 mt-6"><Icon className="w-3 h-3 text-blue-400" />{children}</div>)
const Stepper = ({ label, value, onChange }) => (<div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center justify-between"><span className="text-sm font-bold text-slate-300">{label}</span><div className="flex items-center gap-3"><button onClick={() => onChange(Math.max(1, value - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white"><Minus className="w-4 h-4" /></button><span className="font-mono font-bold w-6 text-center text-blue-200">{value}</span><button onClick={() => onChange(value + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white"><Plus className="w-4 h-4" /></button></div></div>)
const ToggleGrid = ({ options, value, onChange }) => (<div className="grid grid-cols-4 gap-2">{options.map(opt => { const isSelected = String(value) === String(opt.value); return (<button key={opt.value} onClick={() => onChange(opt.value)} className={`py-2 px-1 rounded-lg text-xs font-bold transition-all border ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-white/10'}`}>{opt.label}</button>) })}</div>)

const safeDate = (d) => {
    if (!d) return '??'
    const date = new Date(d)
    return isNaN(date.getTime()) ? '??' : date.toLocaleDateString('cs-CZ')
}

export function DetailLicence({ licence, osobaId, onClose, refreshParent }) {
    const { isAdmin } = useAuth()

    // FAILSAFE: Pokud není licence, nic nezobrazovat (prevence pádu)
    if (!licence) return null

    const JE_TRENERSKA = licence?.typ_role === 'Trenér'
    const [cinnosti, setCinnosti] = useState([])
    const [aktivityList, setAktivityList] = useState([])
    const [filtrSezona, setFiltrSezona] = useState(getAktualniSezona().nazev)
    const [stats, setStats] = useState({ current: 0, projected: 0, req: 150 })

    // Stavy pro editor
    const [modalCinnost, setModalCinnost] = useState(false)
    const [showAddActivity, setShowAddActivity] = useState(false)
    const [editingActivity, setEditingActivity] = useState(null)
    const [formCinnost, setFormCinnost] = useState(null)

    // Náhled v modalu (kalendář)
    const [terminyPreview, setTerminyPreview] = useState([])
    const [ziskaneKredity, setZiskaneKredity] = useState(0)



    useEffect(() => { nacistCinnosti() }, [])

    // PŘEPOČET STATISTIK
    useEffect(() => {
        if (!cinnosti) return

        const { start: renewalStart, end: renewalEnd } = getRenewalPeriod(licence.platnost_do)
        const targets = getLicenseTargets(licence.uroven)

        const isEligible = (datumStr) => {
            if (!renewalStart || !renewalEnd) return true
            const d = new Date(datumStr)
            return d >= renewalStart && d <= renewalEnd
        }

        let aktualni = 0
        let predpoklad = 0
        const trainingDaysSet = new Set()

        // 1. Training days set
        cinnosti.forEach(c => {
            if (c.role === licence.typ_role && (c.typ_aktivity === 'trenink' || !c.typ_aktivity)) {
                const terminy = generovatTerminy(c.datum_od, c.datum_do, c.den_v_tydnu, c.vynechane_datumy)
                terminy.forEach(t => { if (t.aktivni) trainingDaysSet.add(t.datum) })
            }
        })

        // 2. Sum Trainings
        cinnosti.forEach(c => {
            if (c.role === licence.typ_role && (c.typ_aktivity === 'trenink' || !c.typ_aktivity)) {
                const terminy = generovatTerminy(c.datum_od, c.datum_do, c.den_v_tydnu, c.vynechane_datumy)
                const eligibleTerminy = terminy.filter(t => t.aktivni && isEligible(t.datum))
                const creditSum = eligibleTerminy.length
                aktualni += creditSum
                predpoklad += creditSum
            }
        })

        // 3. Sum Matches
        if (aktivityList && JE_TRENERSKA) {
            const processedDates = new Set()
            const eligibleActivities = aktivityList.filter(a => isEligible(a.datum))
            const sortedMatches = [...eligibleActivities].sort((a, b) => new Date(b.datum) - new Date(a.datum))

            sortedMatches.forEach((akt) => {
                if (akt.typ_aktivity === 'publikace' || akt.typ_aktivity === 'seminar') {
                    aktualni += (akt.kredity || 0)
                    predpoklad += (akt.kredity || 0)
                    return
                }
                if (trainingDaysSet.has(akt.datum)) return
                if (processedDates.has(akt.datum)) return

                aktualni += (akt.kredity || 0)
                predpoklad += (akt.kredity || 0)
                if ((akt.kredity || 0) > 0) processedDates.add(akt.datum)
            })
        }

        setStats({
            current: aktualni,
            projected: predpoklad,
            req: targets.req,
            targets: targets,
            renewalStart,
            renewalEnd
        })
    }, [cinnosti, aktivityList, licence])

    // Přepočet kalendáře v editoru
    useEffect(() => {
        if (formCinnost && formCinnost.datum_od && formCinnost.datum_do) {
            try {
                const prev = generovatTerminy(formCinnost.datum_od, formCinnost.datum_do, formCinnost.den_v_tydnu, formCinnost.vynechane_datumy || [])
                setTerminyPreview(prev)
                setZiskaneKredity(prev.filter(t => t.aktivni).length * (formCinnost.pocet_jednotek || 1))
            } catch (e) { console.error(e) }
        }
    }, [formCinnost])

    const nacistCinnosti = async () => {
        const { data } = await supabase.from('cinnosti').select('*').eq('osoba_id', osobaId).order('created_at', { ascending: false })
        if (data) setCinnosti(data)

        const { data: dataAkt } = await supabase.from('aktivity').select('*').eq('osoba_id', osobaId).order('datum', { ascending: false })
        if (dataAkt) setAktivityList(dataAkt)
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

        if (formCinnost.id) await supabase.from('cinnosti').update(payload).eq('id', formCinnost.id)
        else await supabase.from('cinnosti').insert([payload])

        toast.success('Uloženo')
        setModalCinnost(false)
        await nacistCinnosti()

        // Update total credits in license
        const { data: vsechny } = await supabase.from('cinnosti').select('celkem_kreditu').eq('osoba_id', osobaId)
        const total = vsechny ? vsechny.reduce((acc, c) => acc + (c.celkem_kreditu || 0), 0) : 0
        await supabase.from('licence').update({ kredity: total }).eq('id', licence.id)
        if (refreshParent) refreshParent()
    }

    const smazat = async (id, source = 'cinnosti') => {
        if (window.confirm('Opravdu smazat?')) {
            if (source === 'aktivity') {
                await supabase.from('aktivity').delete().eq('id', id)
            } else {
                await supabase.from('cinnosti').delete().eq('id', id)
            }
            toast.success('Smazáno')
            await nacistCinnosti()
            if (refreshParent) refreshParent()
        }
    }

    // LIST FILTERING logic
    const combinedList = []
    if (cinnosti) cinnosti.forEach(c => combinedList.push({ ...c, _source: 'cinnosti' }))
    if (aktivityList) {
        aktivityList.forEach(a => {
            combinedList.push({
                ...a,
                _source: 'aktivity',
                kategorie: a.popis,
                nazev: a.typ_aktivity === 'zapas_int' ? 'Mezinárodní' : 'Zápas ČKS',
                celkem_kreditu: a.kredity,
                datum_od: a.datum,
                datum_do: a.datum,
                sezona: parseInt(a.datum.split('-')[1]) >= 8
                    ? `${a.datum.split('-')[0]}/${parseInt(a.datum.split('-')[0]) + 1}`
                    : `${parseInt(a.datum.split('-')[0]) - 1}/${a.datum.split('-')[0]}`
            })
        })
    }
    const allSeasons = Array.from(new Set(combinedList.map(c => c.sezona).filter(Boolean))).sort((a, b) => b.localeCompare(a))
    const sezonyList = allSeasons
    const filtrovane = (filtrSezona && sezonyList.includes(filtrSezona)) ? combinedList.filter(c => c.sezona === filtrSezona) : combinedList.filter(c => c.sezona === sezonyList[0])
    filtrovane.sort((a, b) => new Date(b.datum_od) - new Date(a.datum_od))

    const percentCurrent = stats.req > 0 ? Math.min(100, (stats.current / stats.req) * 100) : 0
    const percentProjected = stats.req > 0 ? Math.min(100, (stats.projected / stats.req) * 100) : 0
    const progressColor = percentCurrent >= 100 ? 'bg-green-500' : percentCurrent >= 50 ? 'bg-orange-500' : 'bg-red-500'
    const ghostColor = percentProjected >= 100 ? 'bg-green-400/30' : 'bg-white/10'

    // Výpočet pro zobrazení "platné do" s barvičkou
    const daysToExpiry = Math.ceil((new Date(licence.platnost_do) - new Date()) / (1000 * 60 * 60 * 24))
    const isExpired = daysToExpiry < 0
    const expiryColor = isExpired ? 'text-red-500' : daysToExpiry < 90 ? 'text-orange-500' : 'text-green-500'

    return (
        <div className="fixed inset-0 z-50 bg-[#0f172a] animate-fadeIn flex flex-col overflow-hidden">

            {/* HLAVIČKA MODALU (Sticky) */}
            <div className="bg-slate-900/90 backdrop-blur-md border-b border-white/10 p-4 shrink-0 flex items-center justify-between shadow-lg z-20">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Detail licence</div>
                        <div className="text-xl font-black text-white flex items-center gap-2">
                            {licence.typ_role} <span className="text-blue-500 bg-blue-500/10 px-2 rounded-md">{licence.uroven}</span>
                        </div>
                    </div>
                </div>

                {/* Tlačítko Certifikátu vpravo nahoře */}
                {licence.certifikat_url && (
                    <a href={licence.certifikat_url} target="_blank" className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-white/5 transition-all">
                        <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Certifikát</span>
                    </a>
                )}
            </div>

            {/* OBSAH */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* 1. INFO KARTA + PROGRES BAR */}
                    <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">

                        {/* HORNÍ ČÁST: Data a Status - ČASOVÁ OSA */}
                        <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 to-slate-800/50">
                            <div className="flex flex-col md:flex-row gap-8 md:items-center justify-between">

                                <div className="flex-1">
                                    {/* Název sekce */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <CalendarDays className={`w-5 h-5 ${expiryColor}`} />
                                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Časová platnost</span>
                                    </div>

                                    {/* Timeline Visual */}
                                    <div className="flex items-center gap-4 w-full max-w-lg">
                                        {/* Start */}
                                        <div className="text-center">
                                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Získáno</div>
                                            <div className="px-3 py-1 bg-slate-800 rounded-lg text-slate-300 text-sm font-mono border border-white/5">
                                                {safeDate(licence.datum_ziskani)}
                                            </div>
                                        </div>

                                        {/* Line */}
                                        <div className="flex-1 h-px bg-gradient-to-r from-slate-700 via-blue-500 to-slate-700 relative">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                        </div>

                                        {/* End */}
                                        <div className="text-center">
                                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Platnost do</div>
                                            <div className={`px-3 py-1 rounded-lg text-sm font-mono border ${isExpired ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-slate-800 border-white/5 text-white'}`}>
                                                {safeDate(licence.platnost_do)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informace o obnově (jen pro trenéry) */}
                                    {JE_TRENERSKA && stats.renewalStart && (
                                        <div className="mt-4 flex items-center gap-2 text-xs bg-blue-500/5 border border-blue-500/10 px-3 py-2 rounded-lg w-fit">
                                            <Info className="w-3.5 h-3.5 text-blue-400" />
                                            <span className="text-slate-400">Období pro sběr kreditů:</span>
                                            <strong className="text-blue-300">
                                                {safeDate(stats.renewalStart)} — {safeDate(stats.renewalEnd)}
                                            </strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SPODNÍ ČÁST: PROGRES BAR (Pouze pro trenéry) */}
                        {JE_TRENERSKA && (
                            <div className="p-6 md:p-8 border-t border-white/5 bg-slate-900/30">
                                <div className="flex justify-between items-end mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${percentCurrent >= 100 ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-3xl font-black text-white leading-none tracking-tight">{stats.current}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Nahráno kreditů</div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-2 text-lg font-bold">
                                            <span className={stats.projected >= stats.req ? "text-green-400" : "text-white"}>{stats.projected}</span>
                                            <span className="text-slate-600">/ {stats.req}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mt-1 flex items-center justify-end gap-1">
                                            Cíl: {licence.uroven}
                                            {stats.projected >= stats.req ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Lišta */}
                                <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden relative shadow-inner border border-white/5">
                                    {/* Ghost bar (Predikce) */}
                                    <div className={`absolute top-0 left-0 h-full ${ghostColor} transition-all duration-1000 ease-out`} style={{ width: `${percentProjected}%` }}></div>
                                    {/* Main bar (Skutečnost) */}
                                    <div className={`absolute top-0 left-0 h-full ${progressColor} transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,0,0,0.5)]`} style={{ width: `${percentCurrent}%` }}></div>
                                </div>

                                {/* Text pod lištou */}
                                <div className="mt-4 flex items-center justify-between gap-4">
                                    <div className="text-xs font-medium text-slate-400">
                                        {Math.max(0, stats.req - stats.current) > 0 ? (
                                            <span>Zbývá získat <strong className="text-white">{Math.max(0, stats.req - stats.current)}</strong> kreditů</span>
                                        ) : (
                                            <span className="text-green-400 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Podmínky splněny</span>
                                        )}
                                    </div>

                                    {/* Warning při nedostatku */}
                                    {stats.targets && stats.current < stats.req && (
                                        <div className="text-xs font-bold text-orange-400/80 bg-orange-400/10 px-2 py-1 rounded flex items-center gap-1.5">
                                            <AlertTriangle className="w-3 h-3" />
                                            Riziko sestupu na {stats.targets.next || 'Nelicencovaný'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. HISTORIE ČINNOSTÍ */}
                    {JE_TRENERSKA ? (
                        <div className="animate-slideUp">
                            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Briefcase className="w-5 h-5 text-purple-400" /> Činnosti a Zápasy</h3>
                                {isAdmin && (
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowAddActivity(true)} className="bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-white/10 transition-all"><Trophy className="w-4 h-4 text-yellow-400" /> Přidat zápas</button>
                                        <button onClick={otevritNovou} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"><Dumbbell className="w-4 h-4" /> Přidat trénink</button>
                                    </div>
                                )}
                            </div>

                            {/* Filtr sezón */}
                            {sezonyList.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
                                    {sezonyList.map(s => (
                                        <button key={s} onClick={() => setFiltrSezona(s)} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${filtrSezona === s ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Grid karet */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(() => {
                                    // Logika pro detekci duplicit a kolizí
                                    const dateWinners = new Map()
                                    filtrovane.forEach(item => {
                                        if (item._source === 'aktivity') {
                                            const d = item.datum_od
                                            if (!dateWinners.has(d)) { dateWinners.set(d, item) }
                                            else { const existing = dateWinners.get(d); if (new Date(item.created_at) < new Date(existing.created_at)) { dateWinners.set(d, item) } }
                                        }
                                    })
                                    const trainingDays = new Set()
                                    cinnosti.forEach(c => {
                                        if (c.role === licence.typ_role && (c.typ_aktivity === 'trenink' || !c.typ_aktivity)) {
                                            const terminy = generovatTerminy(c.datum_od, c.datum_do, c.den_v_tydnu, c.vynechane_datumy)
                                            terminy.forEach(t => { if (t.aktivni) trainingDays.add(t.datum) })
                                        }
                                    })

                                    return filtrovane.map(akt => {
                                        const isTraining = !akt.typ_aktivity || akt.typ_aktivity === 'trenink'
                                        let finalCredits = akt.celkem_kreditu
                                        let isDuplicate = false
                                        let isCollision = false

                                        if (!isTraining) {
                                            if (trainingDays.has(akt.datum_od)) { finalCredits = 0; isCollision = true }
                                            else { const winner = dateWinners.get(akt.datum_od); if (winner && winner.id !== akt.id) { finalCredits = 0; isDuplicate = true } }
                                        }

                                        return (
                                            <div key={akt.id} className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all group relative bg-slate-800/20 hover:bg-slate-800/40">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="text-lg font-black text-white leading-tight">{akt.kategorie}</div>
                                                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                                                            {isTraining ? <Dumbbell className="w-3 h-3 text-blue-400" /> : <Trophy className="w-3 h-3 text-yellow-400" />}
                                                            <span className="truncate max-w-[150px]">{akt.nazev || (isTraining ? 'Trénink' : 'Zápas/Akce')}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`text-xl font-bold ${isCollision || isDuplicate ? 'text-slate-600' : 'text-purple-400'}`}>{finalCredits}</div>
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
                                                        <button onClick={() => {
                                                            if (isTraining) otevritEditaci(akt)
                                                            else { setEditingActivity(akt); setShowAddActivity(true) }
                                                        }} className="p-1.5 bg-slate-900 rounded-md text-slate-400 hover:text-white border border-white/10"><Edit2 className="w-3.5 h-3.5" /></button>
                                                        <button onClick={() => smazat(akt.id, akt._source)} className="p-1.5 bg-slate-900 rounded-md text-red-400 hover:bg-red-900/20 hover:text-red-300 border border-white/10"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                })()}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* MODAL EDITACE TRÉNINKU */}
            {modalCinnost && formCinnost && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
                    <div className="glass-panel w-full md:max-w-5xl h-full md:h-[90vh] flex flex-col md:rounded-3xl overflow-hidden bg-[#0f172a] border-none md:border border-white/10">
                        {/* Header */}
                        <div className="p-4 bg-slate-900 border-b border-white/10 flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-bold text-white">Editor tréninku</h3>
                            <button onClick={() => setModalCinnost(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="text-slate-400 hover:text-white w-6 h-6" /></button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden overflow-y-auto">
                            {/* Left Side (Controls) */}
                            <div className="w-full lg:w-1/2 p-4 md:p-6 lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-white/10 bg-slate-950/50 shrink-0">
                                <div className="space-y-6">
                                    <div className="relative">
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Sezóna</label>
                                        <div className="relative">
                                            <select className="w-full glass-input p-3 pr-10 appearance-none bg-slate-900 text-white cursor-pointer hover:bg-slate-800/80 transition-colors" value={formCinnost.sezona} onChange={e => { const l = getLimitySezony(e.target.value); setFormCinnost({ ...formCinnost, sezona: e.target.value, datum_od: l.start, datum_do: l.end }) }}>
                                                {getSezonyList().map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <SectionLabel icon={Briefcase}>Kategorie</SectionLabel><ToggleGrid options={[{ value: 'U9', label: 'U9' }, { value: 'U11', label: 'U11' }, { value: 'U13', label: 'U13' }, { value: 'U16', label: 'U16' }, { value: 'U19', label: 'U19' }, { value: 'SEN', label: 'SEN' }]} value={formCinnost.kategorie} onChange={v => setFormCinnost({ ...formCinnost, kategorie: v })} />
                                    <SectionLabel icon={Calendar}>Den</SectionLabel><ToggleGrid options={[{ value: '1', label: 'Po' }, { value: '2', label: 'Út' }, { value: '3', label: 'St' }, { value: '4', label: 'Čt' }, { value: '5', label: 'Pá' }, { value: '6', label: 'So' }, { value: '7', label: 'Ne' }]} value={formCinnost.den_v_tydnu} onChange={v => setFormCinnost({ ...formCinnost, den_v_tydnu: v })} />
                                    <SectionLabel icon={Clock}>Čas a místo</SectionLabel><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><input type="time" className="glass-input p-3 focus:ring-2 focus:ring-blue-500" value={formCinnost.cas_od} onChange={e => setFormCinnost({ ...formCinnost, cas_od: e.target.value })} /><input type="time" className="glass-input p-3 focus:ring-2 focus:ring-blue-500" value={formCinnost.cas_do} onChange={e => setFormCinnost({ ...formCinnost, cas_do: e.target.value })} /></div><input type="text" className="glass-input p-3 w-full mt-2 focus:ring-2 focus:ring-blue-500" placeholder="Adresa místa konání" value={formCinnost.lokace} onChange={e => setFormCinnost({ ...formCinnost, lokace: e.target.value })} />
                                    <SectionLabel icon={Users}>Počet</SectionLabel><Stepper label="Svěřenců" value={formCinnost.pocet_sverencu} onChange={v => setFormCinnost({ ...formCinnost, pocet_sverencu: v })} />
                                </div>
                            </div>

                            {/* Right Side (Preview & Save) */}
                            <div className="w-full lg:w-1/2 flex flex-col bg-slate-900/30 shrink-0">
                                <div className="p-4 border-b border-white/5 flex justify-between items-center sticky top-0 bg-slate-900/95 backdrop-blur z-10 lg:static lg:bg-transparent">
                                    <span className="text-2xl font-black text-purple-500">{ziskaneKredity} kr.</span>
                                    <span className="text-xs text-slate-500 font-bold uppercase">{terminyPreview.filter(t => t.aktivni).length} termínů</span>
                                </div>
                                <div className="lg:flex-1 lg:overflow-y-auto p-4 custom-scrollbar">
                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2">
                                        {terminyPreview.map((t, i) => (
                                            <div key={i} onClick={() => { const n = [...(formCinnost.vynechane_datumy || [])]; if (n.includes(t.datum)) setFormCinnost({ ...formCinnost, vynechane_datumy: n.filter(d => d !== t.datum) }); else setFormCinnost({ ...formCinnost, vynechane_datumy: [...n, t.datum] }) }} className={`p-2 rounded-lg border text-[10px] font-bold text-center cursor-pointer transition-all active:scale-95 ${t.aktivni ? 'bg-slate-800 border-white/10 text-white hover:bg-slate-700 hover:border-white/20' : 'bg-red-900/10 border-red-500/10 text-red-500/50 line-through'}`}>
                                                {new Date(t.datum).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-4 border-t border-white/10 bg-slate-900/50 lg:bg-transparent pb-8 lg:pb-4">
                                    <button onClick={ulozit} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg hover:shadow-blue-900/20 transition-all active:scale-95">
                                        <Save className="w-5 h-5" /> Uložit trénink
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PRO PŘIDÁNÍ AKTIVITY (ZÁPASU) */}
            {showAddActivity && (
                <AddActivityModal
                    osobaId={osobaId}
                    initialData={editingActivity}
                    onClose={() => { setShowAddActivity(false); setEditingActivity(null) }}
                    onSave={async () => {
                        await nacistCinnosti()
                        // Přepočítat kredity v licenci
                        const { data: vsechny } = await supabase.from('cinnosti').select('celkem_kreditu').eq('osoba_id', osobaId)
                        const total = vsechny ? vsechny.reduce((acc, c) => acc + (c.celkem_kreditu || 0), 0) : 0
                        await supabase.from('licence').update({ kredity: total }).eq('id', licence.id)
                        if (refreshParent) refreshParent()
                    }}
                />
            )}
        </div>
    )
}
