import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft, Mail, Phone, Shield, Award, Loader2, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import toast from 'react-hot-toast'
import { LicenceCard } from '../components/LicenceCard'
import { LicenceEditModal } from '../components/LicenceEditModal'
import { DetailLicence } from '../components/DetailLicence'
import { AddLicenceModal } from '../components/AddLicenceModal'
import { AddActivityModal } from '../components/AddActivityModal'
import { CreditRulesModal } from '../components/CreditRulesModal'
import { spocitatKredityDetail } from '../utils/dateUtils'

function DetailOsoby() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { isOwner, isAdmin } = useAuth()
    const { osoby } = useData()

    const [osoba, setOsoba] = useState(null)
    const [loading, setLoading] = useState(true)

    // Stavy pro modaly
    const [editingLicence, setEditingLicence] = useState(null)
    const [selectedLicence, setSelectedLicence] = useState(null)
    const [showAddLicence, setShowAddLicence] = useState(false)
    const [showAddActivity, setShowAddActivity] = useState(false)
    const [showRules, setShowRules] = useState(false)

    // Načítání dat
    // Načítání dat - VŽDY čerstvá data (žádný cache conflict)
    useEffect(() => {
        let isMounted = true

        const fetchFresh = async () => {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from('osoby')
                    .select('*, licence(*), cinnosti(*), aktivity(*), kluby(nazev)')
                    .eq('id', id)
                    .maybeSingle()

                if (error) throw error

                if (isMounted) {
                    if (data) setOsoba(data)
                    else toast.error('Osoba nenalezena')
                }
            } catch (err) {
                console.error(err)
                toast.error('Chyba načítání profilu')
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        fetchFresh()

        return () => { isMounted = false }
    }, [id])

    // --- LOGIKA AKCÍ ---
    const handleSaveLicence = async (licenceId, updates) => {
        if (!isAdmin && !isOwner(osoba.id)) return
        toast.promise(async () => {
            const { error } = await supabase.from('licence').update(updates).eq('id', licenceId)
            if (error) throw error
            setOsoba(prev => ({ ...prev, licence: prev.licence.map(l => l.id === licenceId ? { ...l, ...updates } : l) }))
            setEditingLicence(null)
        }, { loading: 'Ukládám...', success: 'Uloženo!', error: 'Chyba ukládání' })
    }
    const handleRequest = async (licenceId) => {
        toast.promise(async () => {
            const { error } = await supabase.from('licence').update({ zadost_o_prodlouzeni: true }).eq('id', licenceId)
            if (error) throw error
            setOsoba(prev => ({ ...prev, licence: prev.licence.map(l => l.id === licenceId ? { ...l, zadost_o_prodlouzeni: true } : l) }))
        }, { loading: 'Odesílám...', success: 'Odesláno!', error: 'Chyba' })
    }
    const handleRenew = async (licence) => {
        const newDate = new Date(); newDate.setFullYear(newDate.getFullYear() + 2)
        toast.promise(async () => {
            const { error } = await supabase.from('licence').update({ platnost_do: newDate.toISOString().split('T')[0], zadost_o_prodlouzeni: false, aktivni: true }).eq('id', licence.id)
            if (error) throw error
            setOsoba(prev => ({ ...prev, licence: prev.licence.map(l => l.id === licence.id ? { ...l, platnost_do: newDate.toISOString(), zadost_o_prodlouzeni: false, aktivni: true } : l) }))
        }, { loading: 'Prodlužuji...', success: 'Prodlouženo!', error: 'Chyba' })
    }
    const handleDelete = async (licenceId) => {
        if (!window.confirm("Smazat?")) return
        const { error } = await supabase.from('licence').delete().eq('id', licenceId)
        if (!error) {
            setOsoba(prev => ({ ...prev, licence: prev.licence.filter(l => l.id !== licenceId) }))
            setEditingLicence(null)
            toast.success("Smazáno")
        }
    }

    // Refresh dat (volá se po přidání/editaci)
    const refreshData = async () => {
        const { data } = await supabase.from('osoby').select('*, licence(*), cinnosti(*), aktivity(*), kluby(nazev)').eq('id', id).maybeSingle()
        if (data) setOsoba(data)
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0f172a]"><Loader2 className="animate-spin text-slate-500 w-10 h-10" /></div>
    if (!osoba) return null

    const canEdit = isAdmin || isOwner(osoba.id)

    return (
        <div className="w-full max-w-[1800px] mx-auto p-4 md:p-8 pb-32 pt-8 page-enter text-slate-200">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">{osoba.jmeno} {osoba.prijmeni}</h1>
                    <div className="text-slate-400 text-sm flex items-center gap-2"><Shield className="w-3 h-3" /> {osoba.kluby?.nazev || 'Bez klubové příslušnosti'}</div>
                </div>
            </div>

            {/* HLAVNÍ GRID: 2 sloupce na PC (3+9), 1 sloupec na mobilu */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

                {/* LEVÝ SLOUPEC: PROFIL KARTA (Sticky na PC) */}
                <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-24 space-y-6">
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                        <div className="w-40 h-40 rounded-full bg-slate-800 mb-4 overflow-hidden border-4 border-slate-700/50 shadow-2xl relative">
                            {osoba.foto_url ? <img src={osoba.foto_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-slate-600">{osoba.jmeno[0]}</div>}
                        </div>
                        <h1 className="text-2xl font-black text-white mb-1">{osoba.jmeno} {osoba.prijmeni}</h1>
                        <div className="text-slate-400 text-sm flex items-center justify-center gap-2 mb-6"><Shield className="w-3 h-3" /> {osoba.kluby?.nazev || 'Bez klubové příslušnosti'}</div>

                        <div className="w-full space-y-3">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-left">
                                <div className="flex items-center gap-3 text-slate-400 mb-1 text-xs uppercase font-bold tracking-wider"><Mail className="w-3 h-3" /> E-mail</div>
                                <div className="text-white text-sm break-all font-medium">{osoba.email}</div>
                            </div>
                            {osoba.telefon && <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-left"><div className="flex items-center gap-3 text-slate-400 mb-1 text-xs uppercase font-bold tracking-wider"><Phone className="w-3 h-3" /> Telefon</div><div className="text-white text-sm font-medium">{osoba.telefon}</div></div>}
                        </div>
                    </div>
                </div>

                {/* PRAVÝ SLOUPEC: POUZE LICENCE */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-8">

                    {/* SEKCIE LICENCE */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2"><Award className="w-5 h-5 text-blue-400" /> Licence</h2>
                                <button onClick={() => setShowRules(true)} className="text-xs text-slate-400 hover:text-blue-400 underline flex items-center gap-1">
                                    <Award className="w-3 h-3" /> Pravidla kreditů
                                </button>
                            </div>

                            {/* TLAČÍTKO PRO PŘIDÁNÍ LICENCE (Vidí majitel i Admin) */}
                            {canEdit && (
                                <button onClick={() => setShowAddLicence(true)} className="text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg border border-white/10 transition-all flex items-center gap-2">
                                    <Plus className="w-3 h-3" /> Nová licence
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {osoba.licence && osoba.licence.length > 0 ? (
                                osoba.licence.map(lic => {
                                    let aktualniKredity = 0
                                    let predpokladKredity = 0

                                    // 1. Výpočet z "Činností" (Tréninky)
                                    if (osoba.cinnosti) {
                                        const relevantniCinnosti = osoba.cinnosti.filter(c => c.role === lic.typ_role)
                                        relevantniCinnosti.forEach(akt => {
                                            const { aktualni, celkem } = spocitatKredityDetail(akt)
                                            aktualniKredity += aktualni
                                            predpokladKredity += celkem
                                        })
                                    }

                                    // 2. Výpočet z "Aktivity" (Zápasy - pokud je trenér)
                                    if (osoba.aktivity && lic.typ_role === 'Trenér') {
                                        osoba.aktivity.forEach(akt => {
                                            // Kontrola kolize s tréninky (zjednodušená)
                                            let isCollision = false
                                            if (osoba.cinnosti) {
                                                osoba.cinnosti.forEach(c => {
                                                    if ((c.typ_aktivity === 'trenink' || !c.typ_aktivity) && c.datum_od === akt.datum) {
                                                        isCollision = true
                                                    }
                                                })
                                            }

                                            if (!isCollision) {
                                                aktualniKredity += (akt.kredity || 0)
                                                predpokladKredity += (akt.kredity || 0)
                                            }
                                        })
                                    }

                                    if (predpokladKredity === 0 && lic.kredity > 0) {
                                        predpokladKredity = lic.kredity
                                        aktualniKredity = lic.kredity
                                    }

                                    const stats = { current: aktualniKredity, projected: predpokladKredity, req: 150 }

                                    return (
                                        <LicenceCard
                                            key={lic.id}
                                            licence={lic}
                                            stats={stats}
                                            jeAdmin={isAdmin}
                                            canEdit={canEdit}
                                            onRequest={handleRequest}
                                            onRenew={handleRenew}
                                            onDelete={handleDelete}
                                            onClick={() => setSelectedLicence(lic)}
                                        />
                                    )
                                })
                            ) : (
                                <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center text-slate-500 bg-white/5">Žádné licence.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALY */}

            {editingLicence && (
                <LicenceEditModal
                    licence={editingLicence}
                    isAdmin={isAdmin}
                    onClose={() => setEditingLicence(null)}
                    onSave={handleSaveLicence}
                    onDelete={handleDelete}
                />
            )}

            {selectedLicence && (
                <DetailLicence
                    licence={selectedLicence}
                    osobaId={osoba.id}
                    onClose={() => setSelectedLicence(null)}
                    refreshParent={refreshData}
                />
            )}

            {/* NOVÝ MODAL PRO PŘIDÁNÍ LICENCE */}
            {showAddLicence && (
                <AddLicenceModal
                    osobaId={osoba.id}
                    onClose={() => setShowAddLicence(false)}
                    onSave={refreshData}
                />
            )}

            {/* NOVÝ MODAL PRO PŘIDÁNÍ AKTIVITY (Zůstal skrytý v kódu, kdyby bylo třeba v detailu licence) */}
            {showAddActivity && (
                <AddActivityModal
                    osobaId={osoba.id}
                    onClose={() => setShowAddActivity(false)}
                    onSave={refreshData}
                />
            )}

            {/* MODAL S PRAVIDLY */}
            {showRules && <CreditRulesModal onClose={() => setShowRules(false)} />}
        </div>
    )
}

export default DetailOsoby