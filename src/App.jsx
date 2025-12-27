import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Home, Shield, LogOut, User, Loader2, Lock, Crown, Menu } from 'lucide-react'
import { supabase } from './supabaseClient'
import toast from 'react-hot-toast'

import SeznamOsob from './pages/SeznamOsob'
import DetailOsoby from './pages/DetailOsoby'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
// import ForgotPassword from './pages/ForgotPassword' // Zatím zakomentováno, pokud soubor nemáte

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
        if (path === '/admin') return <Crown className="w-6 h-6 text-white"/>
        if (path === '/login') return <Shield className="w-6 h-6 text-white"/>
        if (profil && path === `/osoba/${profil.id}`) return <User className="w-6 h-6 text-white"/> 
        return <Menu className="w-6 h-6 text-white"/>
    }

    // --- DESIGN: Minimalistická pilulka ---
    const containerClasses = isExpanded
        ? "left-1/2 -translate-x-1/2 px-5 py-2 rounded-full w-auto" // Menší padding
        : "left-6 translate-x-0 p-0 rounded-full w-14 h-14 justify-center cursor-pointer border-blue-500/30 hover:scale-110 active:scale-95 flex items-center bg-[#0f172a]"

    // Styl ikon: Žádné pozadí, jen ikona
    const baseIconStyle = "p-2 rounded-full transition-all duration-300 flex flex-col items-center justify-center relative group"
    
    // Neaktivní: Šedá
    const inactiveStyle = "text-slate-500 hover:text-slate-300"
    
    // Aktivní: Bílá + zvětšení
    const activeStyle = "text-white scale-105"

    // Malá modrá tečka pod aktivní ikonou
    const ActiveDot = () => (
        <div className="absolute -bottom-1 w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-fadeIn"></div>
    )

    const isProfileActive = profil && location.pathname === `/osoba/${profil.id}`;

    return (
        <nav 
            className={`fixed bottom-8 z-[999] transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${containerClasses} flex items-center shadow-2xl border border-white/10 bg-[#0f172a]/60 backdrop-blur-xl overflow-hidden`}
            onClick={() => !isExpanded && setIsExpanded(true)}
        >
            {isExpanded ? (
                <div className="flex items-center gap-3 sm:gap-5">
                    
                    {/* 1. DOMŮ */}
                    <Link to="/" className={`${baseIconStyle} ${location.pathname === '/' ? activeStyle : inactiveStyle}`}>
                        <Home className="w-6 h-6"/>
                        {location.pathname === '/' && <ActiveDot />}
                    </Link>

                    {/* 2. PROFIL */}
                    {loading ? (
                        <div className="p-2"><Loader2 className="w-6 h-6 text-slate-500 animate-spin"/></div>
                    ) : (user && profil) ? (
                        <Link to={`/osoba/${profil.id}`} className={`${baseIconStyle} ${isProfileActive ? activeStyle : inactiveStyle}`}>
                            {profil.foto_url ? (
                                <img src={profil.foto_url} className={`w-6 h-6 rounded-full object-cover ring-2 transition-all ${isProfileActive ? 'ring-white/30 grayscale-0' : 'ring-transparent grayscale-[50%] group-hover:grayscale-0'}`}/>
                            ) : (
                                <User className="w-6 h-6"/>
                            )}
                            {isProfileActive && <ActiveDot />}
                        </Link>
                    ) : (
                        <button onClick={handleCenterClick} className={`${baseIconStyle} ${inactiveStyle}`}>
                            <div className="relative">
                                <User className="w-6 h-6"/>
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-slate-700 rounded-full border border-[#0f172a]"></div>
                            </div>
                        </button>
                    )}

                    {/* 3. ADMIN */}
                    {isAdmin && (
                        <Link to="/admin" className={`${baseIconStyle} ${location.pathname === '/admin' ? activeStyle : inactiveStyle}`}>
                            <Crown className="w-6 h-6"/>
                            {location.pathname === '/admin' && <ActiveDot />}
                        </Link>
                    )}
                    
                    {/* 4. LOGIN / LOGOUT */}
                    {user ? (
                        <button onClick={() => supabase.auth.signOut()} className={`${baseIconStyle} ${inactiveStyle} hover:text-red-400`}>
                            <LogOut className="w-6 h-6"/>
                        </button>
                    ) : (
                        <Link to="/login" className={`${baseIconStyle} ${location.pathname === '/login' ? activeStyle : inactiveStyle}`}>
                            <Shield className="w-6 h-6"/>
                            {location.pathname === '/login' && <ActiveDot />}
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
            {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
            <Route path="/osoba/:id" element={<DetailOsoby />} />
            <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
    </Router>
  )
}
export default App