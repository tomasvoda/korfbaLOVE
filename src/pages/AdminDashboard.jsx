import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Users, Clock, AlertCircle, ArrowRight, Crown, Loader2, RefreshCw, Eye, CheckCircle, XCircle, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

function AdminDashboard() {
    const { user, isAdmin, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    
    const [requests, setRequests] = useState([]) // Žádosti o prodloužení
    const [users, setUsers] = useState([])
    const [pendingLicences, setPendingLicences] = useState([]) // Nové neschválené licence
    const [loadingData, setLoadingData] = useState(true)

    const loadDashboardData = async () => {
        setLoadingData(true)
        try {
            // Paralelní načítání všeho potřebného
            const [reqRes, userRes, pendingRes] = await Promise.all([
                // 1. Žádosti o prodloužení (existující licence)
                supabase.from('licence').select('*, osoby(id, jmeno, prijmeni, foto_url)').eq('zadost_o_prodlouzeni', true),
                
                // 2. Uživatelé
                supabase.from('osoby').select('*').not('auth_id', 'is', null).order('last_activity', { ascending: false }),

                // 3. NOVÉ: Neschválené licence (schvaleno = false)
                supabase.from('licence').select('*, osoby(jmeno, prijmeni, foto_url)').eq('schvaleno', false)
            ])

            if (reqRes.error) throw reqRes.error
            if (userRes.error) throw userRes.error
            if (pendingRes.error) throw pendingRes.error

            setRequests(reqRes.data || [])
            setUsers(userRes.data || [])
            setPendingLicences(pendingRes.data || [])

        } catch (error) {
            console.error("Chyba adminu:", error)
            toast.error("Nepodařilo se načíst data")
        } finally {
            setLoadingData(false)
        }
    }

    // Inicializace
    useEffect(() => {
        if (!authLoading) {
            if (user && isAdmin) {
                loadDashboardData()
            } else if (!user) {
                navigate('/')
            }
        }
    }, [user, isAdmin, authLoading])

    // --- AKCE ADMINA ---

    const toggleAdmin = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin'
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
        
        const { error } = await supabase.from('osoby').update({ role: newRole }).eq('id', userId)
        if (error) {
            toast.error("Chyba změny role")
            loadDashboardData()
        } else {
            toast.success(newRole === 'admin' ? "Jmenován Adminem" : "Admin práva odebrána")
        }
    }

    // Schválit novou licenci
    const approveLicence = async (licenceId) => {
        if(!window.confirm('Schválit a aktivovat licenci?')) return
        const { error } = await supabase.from('licence').update({ schvaleno: true, aktivni: true }).eq('id', licenceId)
        if (!error) {
            toast.success('Licence schválena')
            loadDashboardData()
        } else {
            toast.error('Chyba schvalování')
        }
    }

    // Zamítnout (smazat) novou licenci
    const rejectLicence = async (licenceId) => {
        if(!window.confirm('Definitivně zamítnout a smazat tuto žádost?')) return
        const { error } = await supabase.from('licence').delete().eq('id', licenceId)
        if (!error) {
            toast.success('Žádost zamítnuta')
            loadDashboardData()
        } else {
            toast.error('Chyba mazání')
        }
    }

    if (authLoading || (loadingData && users.length === 0)) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-500 w-10 h-10"/></div>

    return (
        <div className="w-full max-w-[1800px] mx-auto p-4 md:p-8 pb-32 pt-8 page-enter">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-1">
                        <Shield className="w-8 h-8 text-blue-500"/> Admin Panel
                    </h1>
                    <p className="text-slate-400 text-sm">Správa evidence, licencí a uživatelů</p>
                </div>
                <button onClick={loadDashboardData} disabled={loadingData} className={`p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 transition-all ${loadingData ? 'animate-spin opacity-50' : ''}`}>
                    <RefreshCw className="w-5 h-5"/>
                </button>
            </div>

            {/* 1. SEKCE: NOVÉ LICENCE KE SCHVÁLENÍ */}
            {pendingLicences.length > 0 && (
                <div className="mb-10 animate-fadeIn">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-400"/> Nové licence ke schválení ({pendingLicences.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingLicences.map(lic => (
                            <div key={lic.id} className="glass-panel p-4 rounded-xl border border-green-500/20 bg-green-500/5 relative">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
                                        {lic.osoby.foto_url ? <img src={lic.osoby.foto_url} className="w-full h-full object-cover"/> : <span className="font-bold text-white">{lic.osoby.jmeno[0]}</span>}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-white truncate">{lic.osoby.prijmeni} {lic.osoby.jmeno}</div>
                                        <div className="text-xs text-green-400 font-bold uppercase">Nová: {lic.typ_role} {lic.uroven}</div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 text-xs text-slate-300 mb-4 bg-black/20 p-2 rounded-lg">
                                    <span>Získáno: {new Date(lic.datum_ziskani).toLocaleDateString()}</span>
                                    {lic.certifikat_url && (
                                        <>
                                            <span className="text-slate-500">|</span>
                                            <a href={lic.certifikat_url} target="_blank" className="flex items-center gap-1 text-blue-400 hover:underline font-bold">
                                                <FileText className="w-3 h-3"/> Doklad
                                            </a>
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => approveLicence(lic.id)} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-lg transition-all active:scale-95">
                                        <CheckCircle className="w-3 h-3"/> Schválit
                                    </button>
                                    <button onClick={() => rejectLicence(lic.id)} className="px-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg transition-colors border border-red-500/20 active:scale-95">
                                        <XCircle className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. SEKCE: ŽÁDOSTI O PRODLOUŽENÍ */}
            <div className="mb-10">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400"/> Žádosti o prodloužení ({requests.length})
                </h2>
                {requests.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center text-slate-500 bg-white/5 text-sm">Vše vyřízeno.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {requests.map(req => (
                            <Link key={req.id} to={`/osoba/${req.osoby.id}`} className="glass-panel p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-all border border-yellow-500/20 hover:border-yellow-500/50 group relative overflow-hidden">
                                <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
                                    {req.osoby.foto_url ? <img src={req.osoby.foto_url} className="w-full h-full object-cover"/> : <span className="font-bold text-white">{req.osoby.jmeno[0]}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-white truncate">{req.osoby.prijmeni} {req.osoby.jmeno}</div>
                                    <div className="text-xs text-yellow-400 font-bold uppercase mt-1">Žádost: {req.typ_role} {req.uroven}</div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-yellow-500/50 group-hover:text-yellow-400 transition-colors"/>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. SEKCE: UŽIVATELÉ */}
            <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400"/> Uživatelé ({users.length})
                </h2>
                
                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 bg-[#0f172a]/50">
                    <div className="divide-y divide-white/5">
                        {users.map(u => (
                            <div key={u.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden font-bold text-white text-xs border border-white/10 shrink-0">
                                        {u.foto_url ? <img src={u.foto_url} className="w-full h-full object-cover"/> : u.jmeno[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-white truncate text-sm flex items-center gap-1">
                                            {u.prijmeni} {u.jmeno} 
                                            {u.role === 'admin' && <Crown className="w-3 h-3 text-yellow-400 fill-yellow-400"/>}
                                        </div>
                                        <div className="text-xs text-slate-500 truncate flex items-center gap-2">
                                            <span>{u.email}</span>
                                            <span className="hidden sm:inline text-slate-600">•</span>
                                            <span className="hidden sm:inline-flex items-center gap-1"><Clock className="w-3 h-3"/> {u.last_activity ? new Date(u.last_activity).toLocaleDateString() : '-'}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => toggleAdmin(u.id, u.role)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all ${u.role === 'admin' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'}`}>
                                    {u.role === 'admin' ? 'ADMIN' : 'USER'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard