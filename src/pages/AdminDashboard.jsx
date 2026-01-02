import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Users, Clock, AlertCircle, ArrowRight, Crown, RefreshCw, CheckCircle, XCircle, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

function AdminDashboard() {
    const { user, isAdmin, loading: authLoading } = useAuth()
    const navigate = useNavigate()

    // --- STAVY ---
    const [requests, setRequests] = useState([])
    const [users, setUsers] = useState([])
    const [pendingLicences, setPendingLicences] = useState([])
    const [historyLicences, setHistoryLicences] = useState([])
    const [loadingData, setLoadingData] = useState(true)
    const [activeTab, setActiveTab] = useState('pending')

    // --- NAČÍTÁNÍ DAT ---
    const loadDashboardData = async () => {
        setLoadingData(true)
        try {
            const [reqRes, userRes, pendRes, histRes] = await Promise.all([
                supabase.from('licence').select('*, osoby(id, jmeno, prijmeni, foto_url)').eq('zadost_o_prodlouzeni', true),
                supabase.from('osoby').select('*').not('last_activity', 'is', null).order('last_activity', { ascending: false }),
                supabase.from('licence').select('*, osoby(jmeno, prijmeni, foto_url)').eq('schvaleno', false),
                supabase.from('licence').select('*, osoby(jmeno, prijmeni)').eq('schvaleno', true).order('created_at', { ascending: false }).limit(10)
            ])

            if (reqRes.error) throw reqRes.error
            if (userRes.error) throw userRes.error
            if (pendRes.error) throw pendRes.error
            if (histRes.error) throw histRes.error

            setRequests(reqRes.data || [])
            setUsers(userRes.data || [])
            setPendingLicences(pendRes.data || [])
            setHistoryLicences(histRes.data || [])

        } catch (error) {
            console.error("Chyba adminu:", error)
            toast.error("Nepodařilo se načíst data")
        } finally {
            setLoadingData(false)
        }
    }

    useEffect(() => {
        if (!authLoading) {
            if (user && isAdmin) {
                loadDashboardData()
            } else if (!user) {
                navigate('/')
            }
        }
    }, [user, isAdmin, authLoading])

    // --- AKCE ---
    const approveLicence = async (licenceId) => {
        if (!window.confirm('Schválit a aktivovat licenci?')) return
        const { error } = await supabase.from('licence').update({ schvaleno: true, aktivni: true }).eq('id', licenceId)
        if (!error) {
            toast.success('Licence schválena')
            loadDashboardData()
        } else {
            toast.error('Chyba schvalování')
        }
    }

    const rejectLicence = async (licenceId) => {
        if (!window.confirm('Definitivně zamítnout a smazat tuto žádost?')) return
        const { error } = await supabase.from('licence').delete().eq('id', licenceId)
        if (!error) {
            toast.success('Žádost zamítnuta')
            loadDashboardData()
        } else {
            toast.error('Chyba mazání')
        }
    }

    const toggleAdmin = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin'
        const { error } = await supabase.from('osoby').update({ role: newRole }).eq('id', userId)
        if (!error) {
            toast.success(newRole === 'admin' ? "Jmenován Adminem" : "Admin práva odebrána")
            loadDashboardData()
        } else {
            toast.error("Chyba změny role")
        }
    }

    const revokeLicence = async (licenceId) => {
        if (!window.confirm('Opravdu chcete tuto licenci zneplatnit?')) return
        const { error } = await supabase.from('licence').update({ schvaleno: false, aktivni: false }).eq('id', licenceId)
        if (!error) {
            toast.success('Licence odvolána')
            loadDashboardData()
        }
    }

    // --- KOMPAKTNÍ NAVIGACE (NavCard) ---
    const NavCard = ({ id, label, count, icon: Icon, color }) => {
        const isActive = activeTab === id

        // Barvy pro aktivní stavy (dynamické třídy v Tailwindu někdy zlobí, proto switch/mapa)
        const activeClasses = {
            'green-500': 'border-green-500/50 bg-green-500/10 text-white',
            'yellow-500': 'border-yellow-500/50 bg-yellow-500/10 text-white',
            'blue-500': 'border-blue-500/50 bg-blue-500/10 text-white'
        }

        const iconColors = {
            'green-500': 'text-green-400',
            'yellow-500': 'text-yellow-400',
            'blue-500': 'text-blue-400'
        }

        return (
            <button
                onClick={() => setActiveTab(id)}
                className={`
                    relative group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 w-full text-left
                    ${isActive
                        ? activeClasses[color] || 'border-white/20 bg-white/10'
                        : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                    }
                `}
            >
                {/* Ikona */}
                <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-colors
                    ${isActive ? 'bg-slate-900/50' : 'bg-slate-800'}
                `}>
                    <Icon className={`w-6 h-6 ${isActive ? iconColors[color] : 'text-slate-400 group-hover:text-white'}`} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>
                        {label}
                    </div>
                    <div className="text-2xl font-black leading-none">
                        {count}
                    </div>
                </div>

                {/* Indikátor (tečka) */}
                {count > 0 && (
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : `bg-${color.split('-')[0]}-500`}`}></div>
                )}
            </button>
        )
    }

    useEffect(() => {
        if (!loadingData && pendingLicences.length === 0 && requests.length > 0 && activeTab === 'pending') {
            setActiveTab('requests')
        }
    }, [loadingData, pendingLicences, requests])


    return (
        <div className="w-full max-w-[1800px] mx-auto p-4 md:p-8 pb-32 pt-6 page-enter text-white">

            {/* HEADER - Kompaktnější */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black flex items-center gap-2 mb-1">
                        <Shield className="w-6 h-6 text-blue-500" /> Admin Panel
                    </h1>
                </div>
                <button onClick={loadDashboardData} disabled={loadingData} className={`p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 transition-all ${loadingData ? 'animate-spin opacity-50' : ''}`}>
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* NAVIGACE - HORIZONTÁLNÍ GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <NavCard
                    id="pending"
                    label="Ke schválení"
                    count={pendingLicences.length}
                    icon={Shield}
                    color="green-500"
                />
                <NavCard
                    id="requests"
                    label="Prodloužení"
                    count={requests.length}
                    icon={AlertCircle}
                    color="yellow-500"
                />
                <NavCard
                    id="users"
                    label="Uživatelé"
                    count={users.length}
                    icon={Users}
                    color="blue-500"
                />
            </div>

            {/* CONTENT AREA */}
            <div className="animate-fadeIn min-h-[400px]">

                {/* 1. KE SCHVÁLENÍ */}
                {activeTab === 'pending' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-lg font-bold text-white">Nové licence</h2>
                            <button onClick={() => setActiveTab('history')} className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
                                <Clock className="w-3 h-3" /> Historie
                            </button>
                        </div>

                        {pendingLicences.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                {pendingLicences.map(lic => (
                                    <div key={lic.id} className="glass-panel p-4 rounded-xl border border-green-500/20 bg-green-500/5 hover:border-green-500/40 transition-all">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
                                                {lic.osoby.foto_url ? <img src={lic.osoby.foto_url} className="w-full h-full object-cover" /> : <span className="font-bold text-white text-sm">{lic.osoby.jmeno[0]}</span>}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-white text-sm truncate">{lic.osoby.prijmeni} {lic.osoby.jmeno}</div>
                                                <div className="text-xs text-green-400 font-bold uppercase">Žádost: {lic.typ_role} {lic.uroven}</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 text-xs text-slate-400 mb-4 bg-black/20 p-2 rounded-lg border border-white/5">
                                            <span>Ze dne: {new Date(lic.datum_ziskani).toLocaleDateString()}</span>
                                            {lic.certifikat_url && (<><span className="text-slate-600">|</span><a href={lic.certifikat_url} target="_blank" className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold"><FileText className="w-3 h-3" /> Certifikát</a></>)}
                                        </div>

                                        <div className="flex gap-2">
                                            <button onClick={() => approveLicence(lic.id)} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-lg transition-all"><CheckCircle className="w-3 h-3" /> Schválit</button>
                                            <button onClick={() => rejectLicence(lic.id)} className="px-3 bg-slate-800 hover:bg-red-900/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-white/5"><XCircle className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 rounded-2xl border border-dashed border-white/10 text-center bg-white/5 flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600"><CheckCircle className="w-6 h-6" /></div>
                                <div className="text-slate-500 text-sm">Žádné nové licence ke schválení.</div>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. PRODLOUŽENÍ */}
                {activeTab === 'requests' && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-white mb-2">Žádosti o prodloužení</h2>
                        {requests.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                {requests.map(req => (
                                    <Link key={req.id} to={`/osoba/${req.osoby.id}`} className="glass-panel p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 transition-all border border-yellow-500/20 hover:border-yellow-500/50 group">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-white/10 relative z-10">
                                            {req.osoby.foto_url ? <img src={req.osoby.foto_url} className="w-full h-full object-cover" /> : <span className="font-bold text-white text-sm">{req.osoby.jmeno[0]}</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-white text-sm truncate">{req.osoby.prijmeni} {req.osoby.jmeno}</div>
                                            <div className="text-xs text-yellow-400 font-bold uppercase flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {req.typ_role} {req.uroven}</div>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-yellow-400 transition-colors" />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 rounded-2xl border border-dashed border-white/10 text-center bg-white/5 flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600"><Clock className="w-6 h-6" /></div>
                                <div className="text-slate-500 text-sm">Žádné žádosti o prodloužení.</div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. UŽIVATELÉ */}
                {activeTab === 'users' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">Seznam uživatelů</h2>
                            <div className="bg-white/5 px-2 py-0.5 rounded text-xs text-slate-400 font-mono">{users.length}</div>
                        </div>
                        <div className="glass-panel rounded-xl overflow-hidden border border-white/5 bg-[#0f172a]/50">
                            <div className="divide-y divide-white/5">
                                {users.map(u => (
                                    <div key={u.id} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden font-bold text-white text-xs border border-white/10 shrink-0">
                                                {u.foto_url ? <img src={u.foto_url} className="w-full h-full object-cover" /> : u.jmeno[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-white text-sm truncate flex items-center gap-2">
                                                    {u.prijmeni} {u.jmeno}
                                                    {u.role === 'admin' && <Crown className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                                                </div>
                                                <div className="text-xs text-slate-500 truncate flex items-center gap-2">
                                                    <span>{u.email}</span>
                                                    <span className="text-slate-700">•</span>
                                                    <span>{u.last_activity ? new Date(u.last_activity).toLocaleDateString() : '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => toggleAdmin(u.id, u.role)} className={`px-2 py-1 rounded text-[10px] font-bold border transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 ${u.role === 'admin' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'}`}>
                                            {u.role === 'admin' ? 'ODEBRAT' : 'JMENOVAT'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. HISTORIE */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">Historie</h2>
                            <button onClick={() => setActiveTab('pending')} className="text-xs font-bold text-slate-500 hover:text-white flex items-center gap-2 transition-colors">
                                <ArrowRight className="w-3 h-3 rotate-180" /> Zpět
                            </button>
                        </div>
                        <div className="glass-panel rounded-xl overflow-hidden border border-white/5 bg-[#0f172a]/50">
                            <div className="divide-y divide-white/5">
                                {historyLicences.map(lic => (
                                    <div key={lic.id} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10 shrink-0 text-white text-xs font-bold">{lic.osoby.jmeno[0]}</div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{lic.osoby.prijmeni} {lic.osoby.jmeno}</div>
                                                <div className="text-xs text-slate-500 font-mono">{lic.typ_role} {lic.uroven} • {new Date(lic.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <button onClick={() => revokeLicence(lic.id)} className="px-2 py-1 rounded bg-red-500/5 hover:bg-red-500/20 text-red-500/60 hover:text-red-400 text-[10px] font-bold transition-colors">Odvolat</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default AdminDashboard