import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Home, Shield, LogOut, User, Loader2, Lock, Crown } from 'lucide-react'
import { supabase } from './supabaseClient'
import toast from 'react-hot-toast'

import SeznamOsob from './pages/SeznamOsob'
import DetailOsoby from './pages/DetailOsoby'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'

function Navbar() {
    const { user, isAdmin, profil, loading } = useAuth()
    const location = useLocation()
    const [isExpanded, setIsExpanded] = useState(true)
    const [lastScrollY, setLastScrollY] = useState(0)

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            if (currentScrollY > 50 && currentScrollY > lastScrollY) setIsExpanded(false)
            setLastScrollY(currentScrollY)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [lastScrollY])

    const handleCenterClick = () => {
        if (!user) toast.error('Pro detail musíte být přihlášen.', { style: { background: '#1e293b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }, icon: '🔒' })
    }

    const getActiveIcon = () => {
        const path = location.pathname
        if (path === '/') return <Home className="w-6 h-6 text-white"/>
        if (path === '/admin') return <Crown className="w-6 h-6 text-white"/> // Sjednocená bílá
        if (path === '/login') return <Shield className="w-6 h-6 text-white"/>
        if (profil && path === `/osoba/${profil.id}`) return <User className="w-6 h-6 text-white"/> 
        return <User className="w-6 h-6 text-white"/>
    }

    const containerClasses = isExpanded
        ? "left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl w-auto" 
        : "left-6 translate-x-0 p-0 rounded-full w-14 h-14 justify-center cursor-pointer border-blue-500/30 hover:scale-110 active:scale-95 flex items-center bg-[#0f172a]"

    // --- JEDNOTNÝ STYL PRO VŠECHNY IKONY ---
    const baseIconStyle = "p-3 rounded-xl transition-all duration-300 flex items-center justify-center border border-transparent"
    
    // Neaktivní: Šedá
    const inactiveStyle = "text-slate-500 hover:text-slate-200 hover:bg-white/5"
    
    // Aktivní: Bílá záře, jemný rámeček (STEJNÉ PRO VŠE)
    const activeStyle = "text-white bg-white/10 border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.15)] scale-105"

    const isProfileActive = profil && location.pathname === `/osoba/${profil.id}`;

    return (
        <nav 
            className={`fixed bottom-8 z-[999] transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${containerClasses} flex items-center shadow-2xl border border-white/10 bg-[#0f172a]/80 backdrop-blur-xl overflow-hidden`}
            onClick={() => !isExpanded && setIsExpanded(true)}
        >
            {isExpanded ? (
                <div className="flex items-center gap-2 sm:gap-4">
                    
                    {/* 1. DOMŮ */}
                    <Link 
                        to="/" 
                        className={`${baseIconStyle} ${location.pathname === '/' ? activeStyle : inactiveStyle}`}
                    >
                        <Home className="w-6 h-6"/>
                    </Link>

                    {/* 2. PROFIL */}
                    {loading ? (
                        <div className="p-3"><Loader2 className="w-6 h-6 text-slate-500 animate-spin"/></div>
                    ) : (user && profil) ? (
                        <Link 
                            to={`/osoba/${profil.id}`} 
                            className={`${baseIconStyle} ${isProfileActive ? activeStyle : inactiveStyle}`}
                        >
                            {profil.foto_url ? (
                                <img src={profil.foto_url} className={`w-6 h-6 rounded-full object-cover ring-2 ${isProfileActive ? 'ring-white/50' : 'ring-transparent'}`}/>
                            ) : (
                                <User className="w-6 h-6"/>
                            )}
                        </Link>
                    ) : (
                        <button onClick={handleCenterClick} className={`${baseIconStyle} ${inactiveStyle} relative`}>
                            <User className="w-6 h-6"/>
                            <div className="absolute top-2 right-2 w-2 h-2 bg-slate-700 rounded-full border-2 border-[#0f172a]"></div>
                        </button>
                    )}

                    {/* 3. ADMIN */}
                    {isAdmin && (
                        <Link 
                            to="/admin" 
                            className={`${baseIconStyle} ${location.pathname === '/admin' ? activeStyle : inactiveStyle}`}
                        >
                            <Crown className="w-6 h-6"/>
                        </Link>
                    )}
                    
                    {/* 4. LOGIN / LOGOUT */}
                    {user ? (
                        <button 
                            onClick={() => supabase.auth.signOut()} 
                            className={`${baseIconStyle} ${inactiveStyle} hover:text-red-400 hover:bg-red-500/10`}
                        >
                            <LogOut className="w-6 h-6"/>
                        </button>
                    ) : (
                        <Link 
                            to="/login" 
                            className={`${baseIconStyle} ${location.pathname === '/login' ? activeStyle : inactiveStyle}`}
                        >
                            <Shield className="w-6 h-6"/>
                        </Link>
                    )}

                </div>
            ) : (
                <div className="w-full h-full flex items-center justify-center animate-fadeIn rounded-full overflow-hidden">
                    {getActiveIcon()}
                </div>
            )}
        </nav>
    )
}

function App() {
  return (
    <Router>
        <Navbar />
        <Routes>
            <Route path="/" element={<SeznamOsob />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/osoba/:id" element={<DetailOsoby />} />
            <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
    </Router>
  )
}
export default App