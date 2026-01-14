import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft, Mail, Phone, Shield, Award, Loader2, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import toast from 'react-hot-toast'
import { LicenceCard } from '../components/LicenceCard'
import { DetailLicence } from '../components/DetailLicence'
import { AddLicenceModal } from '../components/AddLicenceModal'
import { AddActivityModal } from '../components/AddActivityModal'
import { CreditRulesModal } from '../components/CreditRulesModal'
import { calculateLicenseStats } from '../utils/businessLogic'

function DetailOsoby() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { isOwner, isAdmin } = useAuth()
    const { fetchOsobaDetail, invalidateOsoba } = useData()

    const [osoba, setOsoba] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)

    // Modals
    const [selectedLicence, setSelectedLicence] = useState(null)
    const [showAddLicence, setShowAddLicence] = useState(false)
    const [showAddActivity, setShowAddActivity] = useState(false)
    const [showRules, setShowRules] = useState(false)

    const loadData = useCallback(async (force = false) => {
        setLoading(true)
        try {
            const data = await fetchOsobaDetail(id, force)
            if (data) setOsoba(data)
            else setLoadError('Osoba nenalezena.')
        } catch (err) {
            setLoadError(err.message || 'Chyba načítání profilu.')
            toast.error('Chyba načítání profilu')
        } finally {
            setLoading(false)
        }
    }, [id, fetchOsobaDetail])

    useEffect(() => { loadData() }, [id, loadData])

    const refreshData = () => {
        invalidateOsoba(id)
        loadData(true)
    }

    const handleRequest = async (licenceId) => {
        const { error } = await supabase.from('licence').update({ zadost_o_prodlouzeni: true }).eq('id', licenceId)
        if (!error) {
            toast.success('Žádost odeslána')
            refreshData()
        } else toast.error('Chyba odesílání')
    }

    const handleRenew = async (licence) => {
        const newDate = new Date(); newDate.setFullYear(newDate.getFullYear() + 2)
        const { error } = await supabase.from('licence').update({ platnost_do: newDate.toISOString().split('T')[0], zadost_o_prodlouzeni: false, aktivni: true }).eq('id', licence.id)
        if (!error) {
            toast.success('Prodlouženo')
            refreshData()
        } else toast.error('Chyba prodloužení')
    }

    const handleDelete = async (licenceId) => {
        if (!window.confirm("Smazat?")) return
        const { error } = await supabase.from('licence').delete().eq('id', licenceId)
        if (!error) {
            toast.success("Smazáno")
            refreshData()
        }
    }

    if (loading && !osoba) return <div className="min-h-screen flex items-center justify-center bg-[#0f172a]"><Loader2 className="animate-spin text-slate-500 w-10 h-10" /></div>
    if (loadError && !osoba) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-slate-200 px-4"><p className="mb-4">{loadError}</p><button onClick={refreshData} className="px-4 py-2 bg-blue-600 rounded-xl">Zkusit znovu</button></div>
    if (!osoba) return null

    const canEdit = isAdmin || isOwner(osoba.id)

    return (
        <div className="w-full max-w-[1100px] mx-auto p-4 md:p-6 pb-24 pt-1 md:pt-4 page-enter text-slate-200">
            {/* TOP NAVIGATION BAR (Ultra-Compact) */}
            <div className="flex items-center justify-between mb-3 md:mb-5 px-1">
                <button
                    onClick={() => navigate(-1)}
                    className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10 backdrop-blur-xl"
                >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Zpět</span>
                </button>

                <div className="flex items-center gap-2">
                    {osoba.status_evidence && (
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${osoba.status_evidence === 'aktivní' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            osoba.status_evidence === 'nejasné' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-slate-700/30 text-slate-400 border border-white/10'
                            }`}>
                            {osoba.status_evidence}
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6 items-start">
                {/* PROFILE SECTION (Tightened) */}
                <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-4">
                    <div className="glass-panel p-4 md:p-6 border border-white/10 shadow-2xl relative overflow-hidden group/profile">
                        {/* Interactive Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent opacity-0 group-hover/profile:opacity-100 transition-opacity duration-700"></div>

                        <div className="relative flex flex-row lg:flex-col items-center lg:text-center gap-4">
                            {/* Photo / Initials (Slightly Smaller) */}
                            <div className="w-14 h-14 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-2xl md:rounded-3xl lg:rounded-full bg-slate-900 shrink-0 overflow-hidden border border-white/10 shadow-xl relative">
                                {osoba.foto_url ? (
                                    <img src={osoba.foto_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl md:text-3xl lg:text-4xl font-black text-slate-500 bg-gradient-to-br from-slate-900 to-slate-950">
                                        {osoba.jmeno[0]}{osoba.prijmeni[0]}
                                    </div>
                                )}
                            </div>

                            {/* Basic Info */}
                            <div className="flex-1 lg:w-full min-w-0">
                                <h1 className="text-base md:text-xl lg:text-2xl font-black text-white leading-tight mb-0.5 truncate lg:whitespace-normal">
                                    {osoba.jmeno} <br className="hidden lg:block" /> {osoba.prijmeni}
                                </h1>
                                <div className="text-blue-400/80 text-[9px] md:text-xs font-bold flex items-center gap-1 lg:justify-center">
                                    <Shield className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{osoba.kluby?.nazev || 'Bez klubu'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Contact & Extra Info Grid (Ultra-Compact) */}
                        <div className="mt-4 pt-4 border-t border-white/[0.08] grid grid-cols-2 lg:grid-cols-1 gap-1.5 md:gap-2">
                            {osoba.vek && (
                                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] flex flex-col justify-center">
                                    <div className="text-slate-500 text-[8px] font-black uppercase tracking-widest mb-0.5">Věk</div>
                                    <div className="text-white text-[11px] md:text-xs font-bold">{osoba.vek} let</div>
                                </div>
                            )}

                            <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] flex flex-col justify-center overflow-hidden">
                                <div className="text-slate-500 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 mb-0.5">
                                    <Mail className="w-2.5 h-2.5" /> E-mail
                                </div>
                                <div className="text-white text-[10px] md:text-[11px] font-medium truncate" title={osoba.email}>
                                    {osoba.email}
                                </div>
                            </div>

                            {osoba.telefon && (
                                <div className="p-3 rounded-[24px] bg-white/5 border border-white/5 flex flex-col justify-center col-span-2 lg:col-span-1">
                                    <div className="text-slate-500 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
                                        <Phone className="w-2.5 h-2.5" /> Telefon
                                    </div>
                                    <div className="text-white text-xs md:text-sm font-bold">{osoba.telefon}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* LICENCES SECTION (High Contrast) */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-4 md:space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                                <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                                    <Award className="w-5 h-5 text-blue-500" /> Licence
                                </h2>
                                <button
                                    onClick={() => setShowRules(true)}
                                    className="text-[9px] md:text-[10px] font-black text-slate-500 hover:text-blue-400 transition-colors flex items-center gap-1 uppercase tracking-widest"
                                >
                                    Pravidla kreditů
                                </button>
                            </div>
                            {canEdit && (
                                <button
                                    onClick={() => setShowAddLicence(true)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 md:px-4 rounded-full text-[10px] font-black flex items-center gap-1.5 shadow-lg shadow-blue-900/40 transition-all active:scale-95 border border-white/10"
                                >
                                    <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Nová licence</span>
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {osoba.licence?.length > 0 ? (
                                osoba.licence.map(lic => (
                                    <LicenceCard
                                        key={lic.id}
                                        licence={lic}
                                        stats={calculateLicenseStats(lic, osoba.cinnosti, osoba.aktivity)}
                                        jeAdmin={isAdmin}
                                        canEdit={canEdit}
                                        onRequest={handleRequest}
                                        onRenew={handleRenew}
                                        onDelete={handleDelete}
                                        onClick={() => setSelectedLicence(lic)}
                                    />
                                ))
                            ) : (
                                <div className="p-8 rounded-[24px] border-2 border-dashed border-white/[0.05] text-center bg-white/[0.01] backdrop-blur-sm">
                                    <Award className="w-8 h-8 text-slate-800 mx-auto mb-3 opacity-50" />
                                    <p className="text-slate-600 text-xs font-bold uppercase tracking-wider">Zatím nebyly uděleny žádné licence.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedLicence && <DetailLicence licence={selectedLicence} osobaId={osoba.id} onClose={() => setSelectedLicence(null)} refreshParent={refreshData} />}
            {showAddLicence && <AddLicenceModal osobaId={osoba.id} onClose={() => setShowAddLicence(false)} onSave={refreshData} />}
            {showRules && <CreditRulesModal onClose={() => setShowRules(false)} />}
        </div>
    )
}

export default DetailOsoby