import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Users, Clock, AlertCircle, ArrowRight, Crown, Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'

function AdminDashboard() {
    const { user, isAdmin, loading: authLoading } = useAuth()
    const { osoby, fetchOsoby } = useData() 
    const navigate = useNavigate()
    
    const [requests, setRequests] = useState([])
    const [users, setUsers] = useState([])
    const [loadingRequests, setLoadingRequests] = useState(true)

    // 1. KONTROLA PŘÍSTUPU
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            navigate('/')
        }
    }, [user, isAdmin, authLoading])

    // 2. OKAMŽITÉ ZOBRAZENÍ UŽIVATELŮ Z CACHE
    useEffect(() => {
        if (osoby && osoby.length > 0) {
            const activeUsers = osoby
                .filter(o => o.auth_id) // Jen ti co mají účet
                .sort((a, b) => new Date(b.last_activity || 0) - new Date(a.last_activity || 0))
            setUsers(activeUsers)
        } else {
            // Pokud je cache prázdná (F5 na admin stránce), zavoláme fetch
            fetchOsoby()
        }
    }, [osoby])

    // 3. NAČTENÍ ŽÁDOSTÍ (Nezávisle na uživatelích)
    useEffect(() => {
        const fetchReqs = async () => {
            setLoadingRequests(true)
            const { data } = await supabase
                .from('licence')
                .select('*, osoby(id, jmeno, prijmeni, foto_url)')
                .eq('zadost_o_prodlouzeni', true)
            if (data) setRequests(data)
            setLoadingRequests(false)
        }
        if (isAdmin) fetchReqs()
    }, [isAdmin])


    const toggleAdmin = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin'
        // Optimistický update v UI (hned)
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
        
        const { error } = await supabase.from('osoby').update({ role: newRole }).eq('id', userId)
        if (error) {
            toast.error("Chyba změny role")
            fetchOsoby(true) // Revert
        } else {
            toast.success(newRole === 'admin' ? "Uživatel je nyní Admin" : "Práva Admina odebrána")
            fetchOsoby(true) // Sync DB na pozadí
        }
    }

    const formatTime = (isoString) => {
        if (!isoString) return 'Nikdy'
        const d = new Date(isoString)
        return d.toLocaleDateString('cs-CZ') + ' ' + d.toLocaleTimeString('cs-CZ', {hour: '2-digit', minute:'2-digit'})
    }

    if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-500"/></div>

    return (
        <div className="max-w-6xl mx-auto p-4 pb-32 pt-8 animate-fadeIn">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-1">
                        <Shield className="w-8 h-8 text-white"/> Admin Dashboard
                    </h1>
                    <p className="text-slate-400 text-sm">Správa licencí a uživatelů</p>
                </div>
                <button onClick={() => { fetchOsoby(true); toast.success("Data obnovena") }} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5">
                    <RefreshCw className="w-5 h-5"/>
                </button>
            </div>

            {/* ŽÁDOSTI */}
            <div className="mb-10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400"/>
                    Žádosti o prodloužení <span className="text-slate-500 text-sm font-normal">({requests.length})</span>
                </h2>
                
                {loadingRequests ? (
                     <div className="p-8 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2"/>Načítám žádosti...</div>
                ) : requests.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center text-slate-500 bg-white/5">Žádné čekající žádosti.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {requests.map(req => (
                            <Link key={req.id} to={`/osoba/${req.osoby.id}`} className="glass-panel p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-all border border-yellow-500/20 hover:border-yellow-500/50 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors"></div>
                                <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 relative z-10 border border-white/10">
                                    {req.osoby.foto_url ? <img src={req.osoby.foto_url} className="w-full h-full object-cover"/> : <span className="font-bold text-white">{req.osoby.jmeno[0]}</span>}
                                </div>
                                <div className="flex-1 min-w-0 relative z-10">
                                    <div className="font-bold text-white truncate">{req.osoby.prijmeni} {req.osoby.jmeno}</div>
                                    <div className="text-xs text-yellow-400 font-bold uppercase mt-1">Žádost: {req.typ_role} {req.uroven}</div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-yellow-500/50 group-hover:text-yellow-400 transition-colors relative z-10"/>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* UŽIVATELÉ */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400"/>
                    Registrovaní uživatelé <span className="text-slate-500 text-sm font-normal">({users.length})</span>
                </h2>
                
                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 bg-[#0f172a]/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-900/80 text-xs uppercase font-bold text-slate-500 border-b border-white/5">
                                <tr>
                                    <th className="p-4">Uživatel</th>
                                    <th className="p-4">Aktivita</th>
                                    <th className="p-4 text-center">Návštěv</th>
                                    <th className="p-4 text-right">Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden font-bold text-white text-xs border border-white/10">
                                                    {u.foto_url ? <img src={u.foto_url} className="w-full h-full object-cover"/> : u.jmeno[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white flex items-center gap-2">{u.prijmeni} {u.jmeno}</div>
                                                    <div className="text-xs opacity-70">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-xs">
                                                <Clock className="w-3 h-3 text-slate-600"/>
                                                {formatTime(u.last_activity)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-mono text-white text-xs">{u.visit_count || 0}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => toggleAdmin(u.id, u.role)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ml-auto ${u.role === 'admin' ? 'bg-white/10 text-white border-white/20' : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-white'}`}>
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
        </div>
    )
}

export default AdminDashboard