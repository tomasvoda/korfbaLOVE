import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase, clearAuthStorage } from '../supabaseClient'
import { Loader2, LogOut, AlertTriangle } from 'lucide-react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profil, setProfil] = useState(null)
    const [loading, setLoading] = useState(true)
    const [connectionError, setConnectionError] = useState(false) // Stav pro chybu propojení profil <-> auth

    // Ref, abychom věděli, zda komponenta stále žije
    const mounted = useRef(true)

    const refreshSessionIfNeeded = async (session) => {
        if (!session?.expires_at) return session
        const now = Math.floor(Date.now() / 1000)
        // Refreshujeme jen pokud token už expiruje nebo je po expiraci
        if (session.expires_at > now + 30) return session
        const { data, error } = await supabase.auth.refreshSession()
        if (error) throw error
        return data.session
    }

    useEffect(() => {
        mounted.current = true

        // Hlavní inicializace
        const init = async () => {
            try {
                // Safety timeout 5s - aby se appka nezasekla
                const sessionPromise = supabase.auth.getSession()
                const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ error: { message: 'Auth timeout fallback' } }), 5000))

                const { data, error } = await Promise.race([sessionPromise, timeoutPromise])

                if (error || !data?.session) {
                    if (error) console.error("Session Error/Timeout:", error)
                    // Pokud token expiroval nebo timeout, vyčistíme session lokálně
                    // Ale nevoláme signOut() pokud jde o timeout, aby se to nezacyklilo - jen resetujeme state
                    if (error?.message !== 'Auth timeout fallback') {
                        await supabase.auth.signOut()
                        clearAuthStorage()
                    }

                    if (mounted.current) {
                        setUser(null)
                        setProfil(null)
                        setConnectionError(false)
                        setLoading(false)
                    }
                    return
                }

                // Pokud máme session, zkusíme refresh
                const session = data.session
                const validSession = await refreshSessionIfNeeded(session)

                if (validSession?.user) {
                    // Máme uživatele -> jdeme pro profil
                    await loadProfile(validSession.user)
                } else {
                    // Nemáme uživatele -> hotovo
                    if (mounted.current) setLoading(false)
                }
            } catch (err) {
                console.error("Init crash:", err)
                if (mounted.current) {
                    // Fallback: žádná session -> uživatel bude považován za odhlášeného
                    setUser(null)
                    setProfil(null)
                    setConnectionError(false)
                    setLoading(false)
                }
            } finally {
                if (mounted.current) setLoading(false)
            }
        }

        init()

        // Posluchač změn auth stavu (login / logout / refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted.current) return

            if (event === 'SIGNED_OUT') {
                setUser(null); setProfil(null); setLoading(false); setConnectionError(false)
            } else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
                // Načteme profil i při refreshi, pokud jsme ho neměli nebo jsme měli chybu
                if (user?.id !== session.user.id || !profil || connectionError) {
                    await loadProfile(session.user)
                }
            }
        })

        return () => {
            mounted.current = false
            subscription.unsubscribe()
        }
    }, [])

    const loadProfile = async (authUser) => {
        try {
            setUser(authUser)

            // A) Hledání profilu
            let currentUser = authUser
            let { data, error } = await supabase.from('osoby').select('*').eq('auth_id', authUser.id).maybeSingle()
            if (error?.code === 'PGRST301') {
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
                if (refreshError) throw refreshError
                if (refreshData.session?.user) {
                    currentUser = refreshData.session.user
                    setUser(currentUser)
                        ; ({ data, error } = await supabase.from('osoby').select('*').eq('auth_id', currentUser.id).maybeSingle())
                }
            }
            if (error) throw error

            // B) Záložní hledání podle emailu
            if (!data && currentUser.email) {
                const { data: emailData, error: emailError } = await supabase.from('osoby').select('*').ilike('email', currentUser.email).maybeSingle()
                if (emailError) throw emailError
                if (emailData) {
                    await supabase.from('osoby').update({ auth_id: currentUser.id }).eq('id', emailData.id)
                    data = { ...emailData, auth_id: currentUser.id }
                }
            }

            if (mounted.current) {
                if (data) {
                    setProfil(data)
                    setConnectionError(false)
                    setLoading(false)
                    // Statistika "fire and forget"
                    supabase.from('osoby').update({ last_activity: new Date().toISOString() }).eq('id', data.id).then(() => { }).catch(() => { })
                } else {
                    // Uživatel existuje, ale PROFIL NE -> Chyba propojení
                    console.warn("Profil nenalezen!")
                    setProfil(null)
                    setConnectionError(true) // Zobrazíme UI pro chybu
                    setLoading(false)
                }
            }
        } catch (e) {
            console.error("LoadProfile error:", e)
            if (mounted.current) {
                setUser(null)
                setProfil(null)
                setConnectionError(false)
                setLoading(false)
            }
        }
    }

    // Funkce pro "Hrubý restart" - vyčistí jen naše auth data
    const doForceLogout = async () => {
        console.log("Provádím Force Logout")
        try { await supabase.auth.signOut() } catch (e) { console.error(e) }
        clearAuthStorage()

        if (mounted.current) {
            setUser(null); setProfil(null); setConnectionError(false); setLoading(false);
        }
        // Pro jistotu reload, aby se vyčistila paměť prohlížeče
        window.location.href = '/login'
    }

    const isAdmin = profil?.role === 'admin'
    const isOwner = (osobaId) => (!user || !profil) ? false : (isAdmin || String(profil.id) === String(osobaId))

    // --- UI STAVY ---

    // 1. LOADING (Max 2 vteřiny, pak zmizí díky timeoutu)
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        )
    }

    // 2. CHYBA PROPOJENÍ (Z vašeho screenshotu - ale nyní s funkčním tlačítkem)
    if (connectionError && user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
                <div className="glass-panel max-w-md w-full p-8 rounded-3xl border border-red-500/30 bg-red-500/5 text-center">
                    <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h1 className="text-xl font-bold text-white mb-2">Chyba propojení</h1>
                    <p className="text-slate-400 text-sm mb-6">
                        Jste přihlášen jako <strong className="text-white">{user.email}</strong>,<br />
                        ale tento účet není spárovaný s žádnou osobou v seznamu.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={doForceLogout}
                            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                        >
                            <LogOut className="w-5 h-5" /> Odhlásit a zkusit znovu
                        </button>
                        <p className="text-xs text-slate-500 mt-4">
                            Pokud problém přetrvává, kontaktujte administrátora.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <AuthContext.Provider value={{ user, profil, isAdmin, isOwner, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
