import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Users, Clock, AlertCircle, ArrowRight, Crown, Loader2, RefreshCw, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'

function AdminDashboard() {
    const { user, isAdmin, loading: authLoading } = useAuth()
    const { fetchOsoby } = useData() 
    const navigate = useNavigate()
    
    const [requests, setRequests] = useState([])
    const [users, setUsers] = useState([])
    const [loadingData, setLoadingData] = useState(true)

    // Načtení dat (bezpečné)
    const loadDashboardData = async () => {
        setLoadingData(true)
        try {
            // 1. Žádosti
            const { data: reqData, error: reqError } = await supabase
                .from('licence')
                .select('*, osoby(id, jmeno, prijmeni, foto_url)')
                .eq('zadost_o_prodlouzeni', true)
            
            if (reqError) throw reqError
            setRequests(reqData || [])

            // 2. Uživatelé (jen ti, co mají účet)
            const { data: userData, error: userError } = await supabase
                .from('osoby')
                .select('*')
                .not('auth_id', 'is', null) // Jen registrovaní
                .order('last_activity', { ascending: false })

            if (userError) throw userError
            setUsers(userData || [])

        } catch (error) {
            console.error("Chyba adminu:", error)
            toast.error("Nepodařilo se načíst data")
        } finally {
            setLoadingData(false)
        }
    }

    useEffect(() => {
        if (!authLoading) {
            if (!user || !isAdmin) {
                navigate('/')
            } else {
                loadDashboardData()
            }
        }
    }, [user, isAdmin, authLoading])

    const toggleAdmin = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin'
        
        // Optimistický update v UI (hned to překreslí)
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))

        const { error } = await supabase.from('osoby').update({ role: newRole }).eq('id', userId)
        if (error) {
            toast.error("Chyba změny role")
            loadDashboardData() // Vrátit zpět při chybě
        } else {
            toast.success(newRole === 'admin' ? "Jmenován Adminem" : "Admin práva odebrána")
            fetchOsoby(true) // Aktualizovat hlavní cache aplikace
        }
    }

    if (authLoading || loadingData) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-500 w-8 h-8"/></div>

    return (
        <div className="max-w-6xl mx-auto p-4 pb-32 pt-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 mb-1">
                        <Shield className="w-8 h-8 text-white"/> Admin
                    </h1>
                    <p className="text-slate-400 text-xs md:text-sm">Správa evidence</p>
                </div>
                <button onClick={loadDashboardData} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5">
                    <RefreshCw className="w-5 h-5"/>
                </button>
            </div>

            {/* SEKCE: Žádosti */}
            <div className="mb-10">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400"/> Žádosti ({requests.length})
                </h2>
                
                {requests.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-dashed border-white/10 text-center text-slate-500 bg-white/5 text-sm">Vše vyřízeno.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {requests.map(req => (
                            <Link key={req.id} to={`/osoba/${req.osoby.id}`} className="glass-panel p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-all border border-yellow-500/20 hover:border-yellow-500/50 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors"></div>
                                <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
                                    {req.osoby.foto_url ? <img src={req.osoby.foto_url} className="w-full h-full object-cover"/> : <span className="font-bold text-white">{req.osoby.jmeno[0]}</span>}
                                </div>
                                <div className="flex-1 min-w-0 relative z-10">
                                    <div className="font-bold text-white truncate">{req.osoby.prijmeni} {req.osoby.jmeno}</div>
                                    <div className="text-xs text-yellow-400 font-bold uppercase mt-1">Žádost: {req.typ_role} {req.uroven}</div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-yellow-500/50 group-hover:text-yellow-400 transition-colors"/>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* SEKCE: Uživatelé */}
            <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400"/> Uživatelé ({users.length})
                </h2>
                
                {/* MOBILNÍ ZOBRAZENÍ (KARTY) - Vidět jen na mobilu */}
                <div className="md:hidden space-y-3">
                    {users.map(u => (
                        <div key={u.id} className="glass-panel p-4 rounded-xl border border-white/5 bg-[#0f172a]/50">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden font-bold text-white text-xs border border-white/10 shrink-0">
                                        {u.foto_url ? <img src={u.foto_url} className="w-full h-full object-cover"/> : u.jmeno[0]}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-white truncate text-sm flex items-center gap-1">{u.prijmeni} {u.jmeno} {u.role === 'admin' && <Crown className="w-3 h-3 text-yellow-400 fill-yellow-400"/>}</div>
                                        <div className="text-xs text-slate-500 truncate">{u.email}</div>
                                    </div>
                                </div>
                                <button onClick={() => toggleAdmin(u.id, u.role)} className={`p-2 rounded-lg border transition-all ${u.role === 'admin' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                    <Crown className="w-5 h-5"/>
                                </button>
                            </div>
                            <div className="flex justify-between border-t border-white/5 pt-3 text-[10px] text-slate-500 font-bold uppercase">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {u.last_activity ? new Date(u.last_activity).toLocaleDateString() : '-'}</span>
                                <span className="flex items-center gap-1"><Eye className="w-3 h-3"/> {u.visit_count || 0}x</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* DESKTOP ZOBRAZENÍ (TABULKA) - Vidět jen na PC */}
                <div className="hidden md:block glass-panel rounded-2xl overflow-hidden border border-white/5 bg-[#0f172a]/50">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-900/80 text-xs uppercase font-bold text-slate-500 border-b border-white/5">
                            <tr><th className="p-4">Uživatel</th><th className="p-4">Aktivita</th><th className="p-4 text-center">Návštěv</th><th className="p-4 text-right">Role</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-white text-xs border border-white/10">{u.foto_url ? <img src={u.foto_url} className="w-full h-full object-cover"/> : u.jmeno[0]}</div>
                                        <div><div className="font-bold text-white">{u.prijmeni} {u.jmeno}</div><div className="text-xs opacity-70">{u.email}</div></div>
                                    </td>
                                    <td className="p-4 text-xs"><div className="flex items-center gap-2"><Clock className="w-3 h-3"/> {u.last_activity ? new Date(u.last_activity).toLocaleDateString() : '-'}</div></td>
                                    <td className="p-4 text-center font-mono text-white text-xs">{u.visit_count || 0}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => toggleAdmin(u.id, u.role)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ml-auto flex items-center gap-2 transition-all ${u.role === 'admin' ? 'bg-white/10 text-white border-white/20' : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-white'}`}>
                                            {u.role === 'admin' ? <><Crown className="w-3 h-3 text-yellow-400"/> ADMIN</> : 'Uživatel'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard