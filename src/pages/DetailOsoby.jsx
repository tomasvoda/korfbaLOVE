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
import { AddLicenceModal } from '../components/AddLicenceModal' // <--- IMPORT
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
    const [showAddLicence, setShowAddLicence] = useState(false) // <--- NOVÝ STAV

    // Načítání dat
    useEffect(() => {
        if (osoby.length > 0) { const c = osoby.find(o => String(o.id) === String(id)); if (c) { setOsoba(c); setLoading(false); } }
        let isMounted = true
        const fetchFresh = async () => {
            if (!osoba && osoby.length === 0) setLoading(true)
            
            const { data, error } = await supabase
                .from('osoby')
                .select('*, licence(*), cinnosti(*), kluby(nazev)')
                .eq('id', id)
                .maybeSingle()
                
            if (isMounted) {
                if (data) setOsoba(data); 
                setLoading(false);
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
        const { data } = await supabase.from('osoby').select('*, licence(*), cinnosti(*), kluby(nazev)').eq('id', id).maybeSingle()
        if (data) setOsoba(data)
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0f172a]"><Loader2 className="animate-spin text-slate-500 w-10 h-10"/></div>
    if (!osoba) return null

    const canEdit = isAdmin || isOwner(osoba.id)

    return (
        <div className="w-full max-w-[1800px] mx-auto p-4 md:p-8 pb-32 pt-8 page-enter text-slate-200">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6"/>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white">{osoba.jmeno} {osoba.prijmeni}</h1>
                    <div className="text-slate-400 text-sm flex items-center gap-2"><Shield className="w-3 h-3"/> {osoba.kluby?.nazev || 'Bez klubové příslušnosti'}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-3xl h-fit border border-white/5">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-32 h-32 rounded-full bg-slate-800 mb-4 overflow-hidden border-4 border-slate-700/50 shadow-2xl relative">
                             {osoba.foto_url ? <img src={osoba.foto_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-600">{osoba.jmeno[0]}</div>}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3 text-slate-300 mb-1"><Mail className="w-4 h-4 text-slate-500"/> <span className="text-sm font-medium">E-mail</span></div>
                            <div className="text-white text-sm break-all pl-7">{osoba.email}</div>
                        </div>
                        {osoba.telefon && <div className="p-3 rounded-xl bg-white/5 border border-white/5"><div className="flex items-center gap-3 text-slate-300 mb-1"><Phone className="w-4 h-4 text-slate-500"/> <span className="text-sm font-medium">Telefon</span></div><div className="text-white text-sm pl-7">{osoba.telefon}</div></div>}
                    </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Award className="w-5 h-5 text-blue-400"/> Licence</h2>
                        
                        {/* TLAČÍTKO PRO PŘIDÁNÍ LICENCE (Vidí majitel i Admin) */}
                        {canEdit && (
                            <button onClick={() => setShowAddLicence(true)} className="text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg border border-white/10 transition-all flex items-center gap-2">
                                <Plus className="w-3 h-3"/> Nová licence
                            </button>
                        )}
                    </div>

                    {osoba.licence && osoba.licence.length > 0 ? (
                        osoba.licence.map(lic => {
                            let aktualniKredity = 0
                            let predpokladKredity = 0

                            if (osoba.cinnosti) {
                                const relevantniCinnosti = osoba.cinnosti.filter(c => c.role === lic.typ_role)
                                relevantniCinnosti.forEach(akt => {
                                    const { aktualni, celkem } = spocitatKredityDetail(akt)
                                    aktualniKredity += aktualni
                                    predpokladKredity += celkem
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
                        <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center text-slate-500">Prázdno.</div>
                    )}
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

            {/* NOVÝ MODAL PRO PŘIDÁNÍ */}
            {showAddLicence && (
                <AddLicenceModal 
                    osobaId={osoba.id}
                    onClose={() => setShowAddLicence(false)}
                    onSave={refreshData}
                />
            )}
        </div>
    )
}

export default DetailOsoby