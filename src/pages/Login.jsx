import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import toast from 'react-hot-toast'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        
        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success('Vítejte!')
            // ZMĚNA: Po přihlášení jdeme na hlavní seznam
            navigate('/')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel p-8 rounded-3xl w-full max-w-md border border-white/10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                        <Shield className="w-8 h-8 text-white"/>
                    </div>
                    <h1 className="text-2xl font-black text-white">Přihlášení</h1>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input 
                        type="email" 
                        placeholder="Email" 
                        className="w-full glass-input p-4 rounded-xl" 
                        value={email} 
                        onChange={e=>setEmail(e.target.value)} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Heslo" 
                        className="w-full glass-input p-4 rounded-xl" 
                        value={password} 
                        onChange={e=>setPassword(e.target.value)} 
                        required 
                    />
                    <button disabled={loading} className="w-full btn-primary py-4 rounded-xl font-bold text-lg">
                        {loading ? 'Ověřuji...' : 'Přihlásit se'}
                    </button>
                </form>
                <div className="mt-6 text-center pt-6 border-t border-white/5">
                    <p className="text-slate-400 text-sm">Jste tu poprvé? <Link to="/register" className="text-blue-400 font-bold hover:underline">Aktivovat profil</Link></p>
                </div>
            </div>
        </div>
    )
}

export default Login