import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft, Mail, Phone, Shield, Calendar, Award, ExternalLink, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext' // 1. Importujeme cache
import toast from 'react-hot-toast'

function DetailOsoby() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user, isOwner } = useAuth()
    const { osoby } = useData() // 2. Vytáhneme si data z paměti
    
    const [osoba, setOsoba] = useState(null)
    const [loading, setLoading] = useState(true)

    // A. OKAMŽITÉ ZOBRAZENÍ Z PAMĚTI
    useEffect(() => {
        if (osoby.length > 0) {
            const cachedOsoba = osoby.find(o => String(o.id) === String(id))
            if (cachedOsoba) {
                setOsoba(cachedOsoba)
                setLoading(false) // Už nenačítáme, data máme
            }
        }
    }, [id, osoby])

    // B. NAČTENÍ ČERSTVÝCH DAT NA POZADÍ (pro jistotu)
    useEffect(() => {
        const fetchFresh = async () => {
            // Pokud nemáme cache, musíme ukázat loading. Pokud cache máme, loading neukazujeme (uživatel už se dívá na data)
            if (!osoba && osoby.length === 0) setLoading(true)

            const { data, error } = await supabase
                .from('osoby')
                .select('*, licence(*), kluby(nazev)')
                .eq('id', id)
                .single()

            if (error) {
                if (!osoba) toast.error("Osoba nenalezena") // Chybu hlásíme jen když nemáme ani cache
                if (!osoba) navigate('/')
            } else {
                setOsoba(data) // Aktualizujeme data (kdyby se něco změnilo)
            }
            setLoading(false)
        }
        fetchFresh()
    }, [id])

    // ... Zbytek funkcí (handleUpdate, zadost atd.) zůstává stejný ...
    const handleUpdate = async (licenceId) => {
        toast.promise(
            async () => {
                const { error } = await supabase.from('licence').update({ zadost_o_prodlouzeni: true }).eq('id', licenceId)
                if (error) throw error
                // Lokální aktualizace
                setOsoba(prev => ({
                    ...prev,
                    licence: prev.licence.map(l => l.id === licenceId ? { ...l, zadost_o_prodlouzeni: true } : l)
                }))
            },
            { loading: 'Odesílám žádost...', success: 'Žádost odeslána!', error: 'Chyba odesílání' }
        )
    }

    if (loading) return <div className="p-20 text-center text-slate-500 animate-pulse">Načítám profil...</div>
    if (!osoba) return null

    // ... RENDER (HTML) ZŮSTÁVÁ STEJNÝ, jen vkládám začátek pro kontext ...
    return (
        <div className="max-w-4xl mx-auto p-4 pb-32 pt-8 animate-fadeIn">
            {/* Header s tlačítkem Zpět */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6"/>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">{osoba.jmeno} {osoba.prijmeni}</h1>
                    <div className="text-slate-400 text-sm flex items-center gap-2">
                        <Shield className="w-3 h-3"/> {osoba.kluby?.nazev || 'Bez klubové příslušnosti'}
                    </div>
                </div>
                {/* Tlačítka pro editaci (jen Admin/Owner) */}
                {isOwner(osoba.id) && (
                    <div className="ml-auto flex gap-2">
                        {/* Zde by byla tlačítka editace */}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Karta OSOBNÍ ÚDAJE */}
                <div className="glass-panel p-6 rounded-3xl border border-white/5 h-fit">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-32 h-32 rounded-full bg-slate-800 mb-4 overflow-hidden border-4 border-slate-700/50 shadow-2xl">
                            {osoba.foto_url ? (
                                <img src={osoba.foto_url} className="w-full h-full object-cover"/>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-600">
                                    {osoba.jmeno[0]}{osoba.prijmeni[0]}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {osoba.je_trener && <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">TRENÉR</span>}
                            {osoba.je_rozhodci && <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30">ROZHODČÍ</span>}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3 text-slate-300 mb-1">
                                <Mail className="w-4 h-4 text-slate-500"/> <span className="text-sm font-medium">E-mail</span>
                            </div>
                            <div className="text-white text-sm break-all pl-7">{osoba.email}</div>
                        </div>
                        {osoba.telefon && (
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3 text-slate-300 mb-1">
                                    <Phone className="w-4 h-4 text-slate-500"/> <span className="text-sm font-medium">Telefon</span>
                                </div>
                                <div className="text-white text-sm pl-7">{osoba.telefon}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Karta LICENCE */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Award className="w-5 h-5 text-blue-400"/> Licence</h2>
                        {isOwner(osoba.id) && <button className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors text-white">+ Přidat</button>}
                    </div>

                    {osoba.licence && osoba.licence.length > 0 ? (
                        osoba.licence.map(lic => {
                            const isTrener = lic.typ_role === 'Trenér'
                            const isExpired = new Date(lic.platnost_do) < new Date()
                            const daysLeft = Math.ceil((new Date(lic.platnost_do) - new Date()) / (1000 * 60 * 60 * 24))
                            
                            return (
                                <div key={lic.id} className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${isTrener ? 'bg-blue-900/10 border-blue-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                                    {/* Pozadí efekt */}
                                    <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-10 ${isTrener ? 'bg-blue-500' : 'bg-red-500'}`}></div>

                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black ${isTrener ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}>
                                                {lic.uroven}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Role</div>
                                                <div className="text-lg font-bold text-white">{lic.typ_role}</div>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${lic.aktivni ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                                            {lic.aktivni ? <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3"/> AKTIVNÍ</span> : 'NEAKTIVNÍ'}
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-2 gap-4 relative z-10">
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Získáno</div>
                                            <div className="text-sm text-slate-200 font-medium">{new Date(lic.datum_ziskani).toLocaleDateString('cs-CZ')}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Platnost do</div>
                                            <div className={`text-sm font-bold ${isExpired ? 'text-red-400' : 'text-white'}`}>
                                                {new Date(lic.platnost_do).toLocaleDateString('cs-CZ')}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer karty */}
                                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center relative z-10">
                                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                                            <Clock className="w-3 h-3"/> 
                                            {isExpired ? 'Platnost vypršela' : `Zbývá ${daysLeft} dní`}
                                        </div>
                                        
                                        {/* TLAČÍTKO PRODLOUŽENÍ (Zobrazit jen majiteli a pokud se blíží konec) */}
                                        {isOwner(osoba.id) && (
                                            lic.zadost_o_prodlouzeni ? (
                                                <span className="text-xs text-yellow-400 font-medium flex items-center gap-1"><Clock className="w-3 h-3"/> Čeká na schválení</span>
                                            ) : (
                                                <button 
                                                    onClick={() => handleUpdate(lic.id)}
                                                    className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 text-slate-300 hover:text-white"
                                                >
                                                    <RefreshCw className="w-3 h-3"/> Prodloužit
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center text-slate-500">
                            Tato osoba zatím nemá evidovanou žádnou licenci.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DetailOsoby