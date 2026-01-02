import { useState } from 'react'
import { supabase, setAuthPersist, AUTH_PERSIST_KEY } from '../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [rememberMe, setRememberMe] = useState(() => {
        if (typeof localStorage === 'undefined') return true
        const pref = localStorage.getItem(AUTH_PERSIST_KEY)
        return pref ? pref === 'local' : true
    })
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setAuthPersist(rememberMe)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            toast.error(error.message)
            setLoading(false)
        } else {
            toast.success('Vítejte zpět!')
            navigate('/')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 page-enter">
            <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-white/10 relative bg-[#0f172a]/50">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white mb-2">Přihlášení</h1>
                    <p className="text-slate-400 text-sm">Vstup do evidence ČKS</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                            <input type="email" required placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 pl-12 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-500" />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-slate-500 w-5 h-5" />
                            <input type="password" required placeholder="Heslo" value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 pl-12 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-500" />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-white transition-colors font-medium">
                            Zapomněli jste heslo?
                        </Link>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-slate-400 select-none">
                        <input
                            type="checkbox"
                            className="accent-blue-500"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        Zapamatovat přihlášení
                    </label>

                    <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Přihlásit se <ArrowRight className="w-5 h-5" /></>}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-sm">Nemáte ještě účet?</p>
                    <Link to="/register" className="text-blue-400 font-bold hover:text-white transition-colors text-sm">Aktivovat profil</Link>
                </div>
            </div>
        </div>
    )
}

export default Login
