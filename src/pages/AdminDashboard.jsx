import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Shield, Users, RefreshCw, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { PendingLicences } from '../components/admin/PendingLicences'
import { ExtensionRequests } from '../components/admin/ExtensionRequests'
import { UserManagement } from '../components/admin/UserManagement'
import { DashboardHistory } from '../components/admin/DashboardHistory'

function AdminDashboard() {
    const { loading: authLoading } = useAuth()

    const [requests, setRequests] = useState([])
    const [users, setUsers] = useState([])
    const [pendingLicences, setPendingLicences] = useState([])
    const [historyLicences, setHistoryLicences] = useState([])
    const [loadingData, setLoadingData] = useState(true)
    const [activeTab, setActiveTab] = useState('pending')

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
        if (!authLoading) loadDashboardData()
    }, [authLoading])

    const approveLicence = async (licenceId) => {
        if (!window.confirm('Schválit a aktivovat licenci?')) return
        const { error } = await supabase.from('licence').update({ schvaleno: true, aktivni: true }).eq('id', licenceId)
        if (!error) { toast.success('Licence schválena'); loadDashboardData() }
        else toast.error('Chyba schvalování')
    }

    const rejectLicence = async (licenceId) => {
        if (!window.confirm('Definitivně zamítnout a smazat tuto žádost?')) return
        const { error } = await supabase.from('licence').delete().eq('id', licenceId)
        if (!error) { toast.success('Žádost zamítnuta'); loadDashboardData() }
        else toast.error('Chyba mazání')
    }

    const toggleAdmin = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin'
        const { error } = await supabase.from('osoby').update({ role: newRole }).eq('id', userId)
        if (!error) { toast.success(newRole === 'admin' ? "Jmenován Adminem" : "Admin práva odebrána"); loadDashboardData() }
        else toast.error("Chyba změny role")
    }

    const revokeLicence = async (licenceId) => {
        if (!window.confirm('Opravdu chcete tuto licenci zneplatnit?')) return
        const { error } = await supabase.from('licence').update({ schvaleno: false, aktivni: false }).eq('id', licenceId)
        if (!error) { toast.success('Licence odvolána'); loadDashboardData() }
    }

    const NavCard = ({ id, label, count, icon: Icon, color }) => {
        const isActive = activeTab === id
        const activeClasses = {
            'green-500': 'border-green-500/50 bg-green-500/10 text-white',
            'yellow-500': 'border-yellow-500/50 bg-yellow-500/10 text-white',
            'blue-500': 'border-blue-500/50 bg-blue-500/10 text-white'
        }
        const iconColor = isActive ? (color === 'green-500' ? 'text-green-400' : color === 'yellow-500' ? 'text-yellow-400' : 'text-blue-400') : 'text-slate-400'

        return (
            <button onClick={() => setActiveTab(id)} className={`flex items-center gap-4 p-4 rounded-xl border transition-all w-full text-left ${isActive ? activeClasses[color] : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-slate-900/50' : 'bg-slate-800'}`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>{label}</div>
                    <div className="text-2xl font-black leading-none">{count}</div>
                </div>
                {count > 0 && <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : `bg-${color.split('-')[0]}-500`}`}></div>}
            </button>
        )
    }

    return (
        <div className="w-full max-w-[1800px] mx-auto p-4 md:p-8 pb-32 pt-6 page-enter text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-black flex items-center gap-2 mb-1"><Shield className="w-6 h-6 text-blue-500" /> Admin Panel</h1>
                <button onClick={loadDashboardData} disabled={loadingData} className={`p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 transition-all ${loadingData ? 'animate-spin opacity-50' : ''}`}><RefreshCw className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <NavCard id="pending" label="Ke schválení" count={pendingLicences.length} icon={Shield} color="green-500" />
                <NavCard id="requests" label="Prodloužení" count={requests.length} icon={AlertCircle} color="yellow-500" />
                <NavCard id="users" label="Uživatelé" count={users.length} icon={Users} color="blue-500" />
            </div>

            <div className="animate-fadeIn min-h-[400px]">
                {activeTab === 'pending' && <PendingLicences licences={pendingLicences} onApprove={approveLicence} onReject={rejectLicence} onShowHistory={() => setActiveTab('history')} />}
                {activeTab === 'requests' && <ExtensionRequests requests={requests} />}
                {activeTab === 'users' && <UserManagement users={users} onToggleAdmin={toggleAdmin} />}
                {activeTab === 'history' && <DashboardHistory history={historyLicences} onRevoke={revokeLicence} onBack={() => setActiveTab('pending')} />}
            </div>
        </div>
    )
}

export default AdminDashboard