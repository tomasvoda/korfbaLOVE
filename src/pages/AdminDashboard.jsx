import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Users, Clock, AlertCircle, ArrowRight, Crown, Loader2, RefreshCw, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

function AdminDashboard() {
    const { user, isAdmin, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    
    const [requests, setRequests] = useState([])
    const [users, setUsers] = useState([])
    const [loadingData, setLoadingData] = useState(true)

    const loadDashboardData = async () => {
        setLoadingData(true)
        try {
            // Paralelní načítání = mnohem rychlejší
            const [reqRes, userRes] = await Promise.all([
                supabase.from('licence').select('*, osoby(id, jmeno, prijmeni, foto_url)').eq('zadost_o_prodlouzeni', true),
                supabase.from('osoby').select('*').not('auth_id', 'is', null).order('last_activity', { ascending: false })
            ])

            if (reqRes.error) throw reqRes.error
            if (userRes.error) throw userRes.error

            setRequests(reqRes.data || [])
            setUsers(userRes.data || [])
        } catch (error) {
            console.error("Chyba adminu:", error)
            toast.error("Nepodařilo se načíst data")
        } finally {
            setLoadingData(false)
        }
    }

    // Spustí se JEN JEDNOU při načtení, pokud je uživatel admin
    useEffect(() => {
        if (!authLoading) {
            if (user && isAdmin) {
                loadDashboardData()
            } else if (!user) {
                navigate('/')
            }
        }
    }, [user, isAdmin, authLoading])

    const toggleAdmin = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin'
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u)) // Optimistický update
        
        const { error } = await supabase.from('osoby').update({ role: newRole }).eq('id', userId)
        if (error) {
            toast.error("Chyba změny role")
            loadDashboardData()
        } else {
            toast.success(newRole === 'admin' ? "Jmenován Adminem" : "Admin práva odebrána")
        }
    }

    if (authLoading || (loadingData && users.length === 0)) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-500 w-10 h-10"/></div>

    return (
        <div className="max-w-6xl mx-auto p-4 pb-32 pt-8 page-enter">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-1">
                        <Shield className="w-8 h-8 text-blue-500"/> Admin Panel
                    </h1>
                    <p className="text-slate-400 text-sm">Správa evidence a uživatelů</p>
                </div>
                <button onClick={loadDashboardData} disabled={loadingData} className={`p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 transition-all ${loadingData ? 'animate-spin opacity-50' : ''}`}>
                    <RefreshCw className="w-5 h-5"/>
                </button>
            </div>

            {/* Žádosti */}
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

            {/* Uživatelé */}
            <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400"/> Uživatelé ({users.length})
                </h2>
                
                {/* Mobile & Desktop List */}
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