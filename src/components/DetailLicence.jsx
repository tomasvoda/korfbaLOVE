import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import toast from 'react-hot-toast'
import { ArrowLeft, Clock, MapPin, Edit2, Trash2, Plus, Calendar, Users, Briefcase, Info, RefreshCw, Download, Save, X, Minus, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import { getAktualniSezona, getSezonyList, generovatTerminy, getLimitySezony, spocitatKredityDetail } from '../utils/dateUtils'
import { useAuth } from '../contexts/AuthContext'

// --- HELPERY PRO UI ---
const SectionLabel = ({ icon: Icon, children }) => (<div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 mt-6"><Icon className="w-3 h-3 text-blue-400" />{children}</div>)
const Stepper = ({ label, value, onChange }) => (<div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center justify-between"><span className="text-sm font-bold text-slate-300">{label}</span><div className="flex items-center gap-3"><button onClick={() => onChange(Math.max(1, value - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white"><Minus className="w-4 h-4"/></button><span className="font-mono font-bold w-6 text-center text-blue-200">{value}</span><button onClick={() => onChange(value + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white"><Plus className="w-4 h-4"/></button></div></div>)
const ToggleGrid = ({ options, value, onChange }) => (<div className="grid grid-cols-4 gap-2">{options.map(opt => { const isSelected = String(value) === String(opt.value); return (<button key={opt.value} onClick={() => onChange(opt.value)} className={`py-2 px-1 rounded-lg text-xs font-bold transition-all border ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-white/10'}`}>{opt.label}</button>)})}</div>)

export function DetailLicence({ licence, osobaId, onClose, refreshParent }) {
    const { isAdmin } = useAuth()
    const [cinnosti, setCinnosti] = useState([])
    const [filtrSezona, setFiltrSezona] = useState(getAktualniSezona().nazev)
    
    // Statistiky pro horní panel
    const [stats, setStats] = useState({ current: 0, projected: 0, req: 150 })

    // Stavy pro editor
    const [modalCinnost, setModalCinnost] = useState(false)
    const [formCinnost, setFormCinnost] = useState(null)
    
    // Náhled v modalu (kalendář)
    const [terminyPreview, setTerminyPreview] = useState([])
    const [ziskaneKredity, setZiskaneKredity] = useState(0)

    const JE_TRENERSKA = licence.typ_role === 'Trenér'
    
    useEffect(() => { nacistCinnosti() }, [])

    // PŘEPOČET STATISTIK (Jakmile se načtou činnosti)
    useEffect(() => {
        if (!cinnosti) return
        
        let aktualni = 0
        let predpoklad = 0

        // Projdeme činnosti a sečteme jen ty, které patří k této roli (abychom nemíchali trenéra a rozhodčího)
        cinnosti.forEach(c => {
            if (c.role === licence.typ_role) {
                const vysledek = spocitatKredityDetail(c)
                aktualni += vysledek.aktualni
                predpoklad += vysledek.celkem
            }
        })

        // Fallback: Pokud nejsou činnosti, použijeme uloženou hodnotu z DB
        if (predpoklad === 0 && licence.kredity > 0) {
            predpoklad = licence.kredity
            aktualni = licence.kredity
        }

        setStats({
            current: aktualni,
            projected: predpoklad,
            req: 150 // Cíl
        })
    }, [cinnosti, licence])

    // Přepočet kalendáře v editoru
    useEffect(() => {
        if (formCinnost && formCinnost.datum_od && formCinnost.datum_do) {
            try {
                const prev = generovatTerminy(formCinnost.datum_od, formCinnost.datum_do, formCinnost.den_v_tydnu, formCinnost.vynechane_datumy || [])
                setTerminyPreview(prev)
                setZiskaneKredity(prev.filter(t => t.aktivni).length * (formCinnost.pocet_jednotek || 1))
            } catch(e) { console.error(e) }
        }
    }, [formCinnost])

    const nacistCinnosti = async () => {
        const { data } = await supabase.from('cinnosti').select('*').eq('osoba_id', osobaId).order('created_at', { ascending: false })
        if (data) setCinnosti(data)
    }

    // FORM LOGIKA (stejná jako předtím)
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
        if(!formCinnost.lokace) return toast.error('Chybí lokace')
        const prev = generovatTerminy(formCinnost.datum_od, formCinnost.datum_do, formCinnost.den_v_tydnu, formCinnost.vynechane_datumy)
        const finalKredity = prev.filter(t => t.aktivni).length * (formCinnost.pocet_jednotek || 1)
        const dnyNazvy = ['?','Po','Út','St','Čt','Pá','So','Ne']
        const autoNazev = `${formCinnost.kategorie} - ${dnyNazvy[parseInt(formCinnost.den_v_tydnu)] || '?'}`
        
        const payload = {
            osoba_id: osobaId, nazev: autoNazev, kategorie: formCinnost.kategorie, lokace: formCinnost.lokace,
            den_v_tydnu: parseInt(formCinnost.den_v_tydnu), cas_od: formCinnost.cas_od, cas_do: formCinnost.cas_do,
            datum_od: formCinnost.datum_od, datum_do: formCinnost.datum_do, sezona: formCinnost.sezona,
            role: formCinnost.role, pocet_jednotek: formCinnost.pocet_jednotek, pocet_sverencu: formCinnost.pocet_sverencu,
            vynechane_datumy: formCinnost.vynechane_datumy, celkem_kreditu: finalKredity
        }
        
        if(formCinnost.id) await supabase.from('cinnosti').update(payload).eq('id', formCinnost.id)
        else await supabase.from('cinnosti').insert([payload])
        
        toast.success('Uloženo')
        setModalCinnost(false)
        
        // Obnovit data (to spustí i přepočet statistik)
        await nacistCinnosti()
        
        // Zapsat součet do DB pro hlavní kartu
        const { data: vsechny } = await supabase.from('cinnosti').select('celkem_kreditu').eq('osoba_id', osobaId)
        const total = vsechny ? vsechny.reduce((acc, c) => acc + (c.celkem_kreditu || 0), 0) : 0
        await supabase.from('licence').update({ kredity: total }).eq('id', licence.id)
        if (refreshParent) refreshParent()
    }

    const smazat = async (id) => {
        if(window.confirm('Opravdu smazat?')) {
            await supabase.from('cinnosti').delete().eq('id', id)
            toast.success('Smazáno')
            await nacistCinnosti()
            if (refreshParent) refreshParent()
        }
    }

    const sezonyList = Array.from(new Set(cinnosti.map(c => c.sezona).filter(Boolean))).sort((a,b)=>b.localeCompare(a))
    const filtrovane = (filtrSezona && sezonyList.includes(filtrSezona)) ? cinnosti.filter(c => c.sezona === filtrSezona) : cinnosti.filter(c => c.sezona === sezonyList[0])

    // --- VÝPOČET BAREV PROGRES BARU ---
    const percentCurrent = stats.req > 0 ? Math.min(100, (stats.current / stats.req) * 100) : 0
    const percentProjected = stats.req > 0 ? Math.min(100, (stats.projected / stats.req) * 100) : 0
    const progressColor = percentCurrent >= 100 ? 'bg-green-500' : percentCurrent >= 50 ? 'bg-orange-500' : 'bg-red-500'
    const ghostColor = percentProjected >= 100 ? 'bg-green-400/30' : 'bg-white/10'

    return (
        <div className="fixed inset-0 z-50 bg-[#0f172a] animate-fadeIn flex flex-col overflow-hidden">
            {/* HLAVIČKA */}
            <div className="bg-slate-900/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-6 h-6"/></button>
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Detail licence</div>
                        <div className="text-xl font-black text-white flex items-center gap-2">
                            {licence.typ_role} <span className="text-blue-500">{licence.uroven}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* OBSAH */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-8">
                    
                    {/* 1. INFO KARTA + PROGRES BAR */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
                        
                        {/* Datumy a Certifikát */}
                        <div className="flex flex-wrap gap-8 items-center justify-between">
                            <div className="flex gap-8">
                                <div><div className="text-xs text-slate-500 font-bold uppercase mb-1">Datum získání</div><div className="text-lg font-mono text-white">{new Date(licence.datum_ziskani).toLocaleDateString()}</div></div>
                                <div><div className="text-xs text-slate-500 font-bold uppercase mb-1">Platnost do</div><div className="text-lg font-mono text-white">{new Date(licence.platnost_do).toLocaleDateString()}</div></div>
                            </div>
                            {licence.certifikat_url && (
                                <a href={licence.certifikat_url} target="_blank" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-colors">
                                    <Download className="w-4 h-4"/> Certifikát
                                </a>
                            )}
                        </div>

                        {/* PROGRES BAR SEKCE */}
                        {JE_TRENERSKA && (
                            <div className="pt-6 border-t border-white/5">
                                <div className="flex justify-between items-end mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><TrendingUp className="w-5 h-5"/></div>
                                        <div>
                                            <div className="text-2xl font-black text-white leading-none">{stats.current}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Aktuálně</div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-1.5 text-sm font-bold">
                                            <span className={stats.projected >= stats.req ? "text-green-400" : "text-white"}>{stats.projected}</span>
                                            <span className="text-slate-600">/ {stats.req}</span>
                                            {stats.projected >= stats.req ? <CheckCircle className="w-4 h-4 text-green-500"/> : <AlertTriangle className="w-4 h-4 text-yellow-500"/>}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Předpoklad</div>
                                    </div>
                                </div>
                                
                                {/* Lišta */}
                                <div className="h-3 w-full bg-slate-700/30 rounded-full overflow-hidden relative">
                                    {/* Ghost bar */}
                                    <div className={`absolute top-0 left-0 h-full ${ghostColor} transition-all duration-1000 ease-out`} style={{ width: `${percentProjected}%` }}></div>
                                    {/* Main bar */}
                                    <div className={`absolute top-0 left-0 h-full ${progressColor} transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,0,0,0.5)]`} style={{ width: `${percentCurrent}%` }}></div>
                                </div>
                                
                                <div className="mt-2 text-xs text-slate-500 flex justify-between">
                                    <span>Zbývá splnit: {Math.max(0, stats.req - stats.current)} bodů</span>
                                    <span>{percentCurrent >= 100 ? 'Splněno!' : `Plnění: ${Math.round(percentCurrent)}%`}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. ČINNOST */}
                    {JE_TRENERSKA ? (
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Briefcase className="w-5 h-5 text-purple-400"/> Historie činnosti</h3>
                                {isAdmin && <button onClick={otevritNovou} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"><Plus className="w-4 h-4"/> Přidat činnost</button>}
                            </div>

                            {sezonyList.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
                                    {sezonyList.map(s => (<button key={s} onClick={() => setFiltrSezona(s)} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${filtrSezona === s ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:text-white'}`}>{s}</button>))}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filtrovane.map(akt => (
                                    <div key={akt.id} className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all group relative">
                                        <div className="flex justify-between items-start mb-3">
                                            <div><div className="text-lg font-black text-white">{akt.kategorie}</div><div className="text-xs text-slate-400">{akt.nazev}</div></div>
                                            <div className="text-right"><div className="text-xl font-bold text-purple-400">{akt.celkem_kreditu}</div><div className="text-[10px] text-slate-500 uppercase font-bold">Kreditů</div></div>
                                        </div>
                                        <div className="space-y-2 text-sm text-slate-300">
                                            <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-500"/> {akt.cas_od.slice(0,5)} - {akt.cas_do.slice(0,5)}</div>
                                            <div className="flex items-center gap-2 truncate"><MapPin className="w-3.5 h-3.5 text-slate-500"/> {akt.lokace}</div>
                                        </div>
                                        {isAdmin && (
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button onClick={() => otevritEditaci(akt)} className="p-1.5 bg-slate-800 rounded-md text-slate-400 hover:text-white"><Edit2 className="w-3.5 h-3.5"/></button>
                                                <button onClick={() => smazat(akt.id)} className="p-1.5 bg-slate-800 rounded-md text-red-400 hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5"/></button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel p-10 text-center rounded-2xl border border-dashed border-white/10"><Info className="w-10 h-10 text-slate-600 mx-auto mb-4"/><p className="text-slate-400">Evidence delegací rozhodčích se připravuje.</p></div>
                    )}
                </div>
            </div>

            {/* MODAL EDITACE (Beze změny, jen pro úplnost) */}
            {modalCinnost && formCinnost && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
                    <div className="glass-panel w-full max-w-5xl h-[90vh] flex flex-col rounded-3xl overflow-hidden bg-[#0f172a] border border-white/10">
                        <div className="p-4 bg-slate-900 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Editor činnosti</h3>
                            <button onClick={()=>setModalCinnost(false)}><X className="text-slate-400 hover:text-white w-6 h-6"/></button>
                        </div>
                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-white/10 bg-slate-950/50">
                                <div className="space-y-6">
                                    <div><label className="text-xs font-bold text-slate-500 uppercase">Sezóna</label><select className="w-full glass-input p-3 mt-1 bg-slate-900" value={formCinnost.sezona} onChange={e => {const l = getLimitySezony(e.target.value); setFormCinnost({...formCinnost, sezona:e.target.value, datum_od:l.start, datum_do:l.end})}}>{getSezonyList().map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                                    <SectionLabel icon={Briefcase}>Kategorie</SectionLabel><ToggleGrid options={[{value:'U9',label:'U9'},{value:'U11',label:'U11'},{value:'U13',label:'U13'},{value:'U16',label:'U16'},{value:'U19',label:'U19'},{value:'SEN',label:'SEN'}]} value={formCinnost.kategorie} onChange={v=>setFormCinnost({...formCinnost, kategorie:v})} />
                                    <SectionLabel icon={Calendar}>Den</SectionLabel><ToggleGrid options={[{value:'1',label:'Po'},{value:'2',label:'Út'},{value:'3',label:'St'},{value:'4',label:'Čt'},{value:'5',label:'Pá'},{value:'6',label:'So'},{value:'7',label:'Ne'}]} value={formCinnost.den_v_tydnu} onChange={v=>setFormCinnost({...formCinnost, den_v_tydnu:v})} />
                                    <SectionLabel icon={Clock}>Čas a místo</SectionLabel><div className="grid grid-cols-2 gap-2"><input type="time" className="glass-input p-3" value={formCinnost.cas_od} onChange={e=>setFormCinnost({...formCinnost, cas_od:e.target.value})} /><input type="time" className="glass-input p-3" value={formCinnost.cas_do} onChange={e=>setFormCinnost({...formCinnost, cas_do:e.target.value})} /></div><input type="text" className="glass-input p-3 w-full mt-2" placeholder="Adresa" value={formCinnost.lokace} onChange={e=>setFormCinnost({...formCinnost, lokace:e.target.value})} />
                                    <SectionLabel icon={Users}>Počet</SectionLabel><Stepper label="Svěřenců" value={formCinnost.pocet_sverencu} onChange={v=>setFormCinnost({...formCinnost, pocet_sverencu:v})} />
                                </div>
                            </div>
                            <div className="w-full lg:w-1/2 flex flex-col bg-slate-900/30">
                                <div className="p-4 border-b border-white/5 flex justify-between items-center"><span className="text-2xl font-black text-purple-500">{ziskaneKredity} kr.</span><span className="text-xs text-slate-500">{terminyPreview.filter(t=>t.aktivni).length} termínů</span></div>
                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar"><div className="grid grid-cols-3 gap-2">{terminyPreview.map((t,i)=>(<div key={i} onClick={()=>{const n=[...(formCinnost.vynechane_datumy||[])]; if(n.includes(t.datum)) setFormCinnost({...formCinnost, vynechane_datumy:n.filter(d=>d!==t.datum)}); else setFormCinnost({...formCinnost, vynechane_datumy:[...n, t.datum]})}} className={`p-2 rounded border text-[10px] text-center cursor-pointer transition-colors ${t.aktivni ? 'bg-slate-800 border-white/10 text-white hover:bg-slate-700' : 'bg-red-900/20 border-red-500/20 text-red-400 line-through opacity-50'}`}>{new Date(t.datum).toLocaleDateString('cs-CZ', {day:'numeric', month:'numeric'})}</div>))}</div></div>
                                <div className="p-4 border-t border-white/10"><button onClick={ulozit} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg transition-all active:scale-95"><Save className="w-5 h-5"/> Uložit činnost</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}