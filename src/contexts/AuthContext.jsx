import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profil, setProfil] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) await nactiAParujProfil(session.user)
            else setLoading(false)
        }
        init()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                setUser(null); setProfil(null); setLoading(false)
            } else if (session?.user) {
                await nactiAParujProfil(session.user)
            }
        })
        return () => subscription.unsubscribe()
    }, [])

    const nactiAParujProfil = async (authUser) => {
        setUser(authUser)
        try {
            // 1. Zkusíme najít profil podle auth_id
            let { data, error } = await supabase.from('osoby').select('*').eq('auth_id', authUser.id).maybeSingle()

            // 2. Pokud není, zkusíme podle emailu a spárujeme
            if (!data) {
                const { data: dataByEmail } = await supabase.from('osoby').select('*').ilike('email', authUser.email.trim()).maybeSingle()
                if (dataByEmail) {
                    await supabase.from('osoby').update({ auth_id: authUser.id }).eq('id', dataByEmail.id)
                    data = { ...dataByEmail, auth_id: authUser.id }
                }
            }

            if (data) {
                setProfil(data)
                // --- NOVÉ: AKTUALIZACE STATISTIKY (jen jednou za sezení, aby to neblikalo pořád) ---
                // Zde děláme jednoduchý update: nastavíme čas a zvýšíme visit_count o 1
                await supabase.from('osoby').update({ 
                    last_activity: new Date().toISOString(),
                    visit_count: (data.visit_count || 0) + 1
                }).eq('id', data.id)
            }
        } catch (err) {
            console.error("Auth Error:", err)
        } finally {
            setLoading(false)
        }
    }

    const isAdmin = profil?.role === 'admin'
    const isOwner = (osobaId) => (!user || !profil) ? false : (isAdmin || String(profil.id) === String(osobaId))

    return (
        <AuthContext.Provider value={{ user, profil, isAdmin, isOwner, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)