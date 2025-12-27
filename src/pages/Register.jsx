import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'
import { UserPlus, Info } from 'lucide-react'
import toast from 'react-hot-toast'

function Register() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [odeslano, setOdeslano] = useState(false)

    const handleRegister = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) toast.error(error.message)
        else { setOdeslano(true); toast.success('Ověřovací e-mail odeslán!') }
        setLoading(false)
    }

    if (odeslano) return (<div className="min-h-screen flex items-center justify-center p-4"><div className="glass-panel p-8 rounded-3xl w-full max-w-md text-center border border-white/10"><div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4"><UserPlus className="w-8 h-8"/></div><h2 className="text-2xl font-bold text-white mb-2">Zkontrolujte e-mail</h2><p className="text-slate-400 mb-6">Potvrzovací odkaz byl odeslán na <strong>{email}</strong>.</p><Link to="/login" className="btn-primary py-3 px-6 rounded-xl font-bold">Přejít na přihlášení</Link></div></div>)

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel p-8 rounded-3xl w-full max-w-md border border-white/10">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-black text-white">Registrace</h1>
                    <div className="mt-4 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex gap-3 text-left"><Info className="w-5 h-5 text-blue-400 shrink-0"/><p className="text-xs text-blue-200"><strong>Důležité:</strong> Použijte stejný e-mail, který je uveden v seznamu osob.</p></div>
                </div>
                <form onSubmit={handleRegister} className="space-y-4">
                    <input type="email" placeholder="E-mail" className="w-full glass-input p-4 rounded-xl" value={email} onChange={e=>setEmail(e.target.value)} required />
                    <input type="password" placeholder="Heslo (min 6 znaků)" className="w-full glass-input p-4 rounded-xl" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
                    <button disabled={loading} className="w-full btn-primary py-4 rounded-xl font-bold text-lg">{loading ? 'Pracuji...' : 'Vytvořit účet'}</button>
                </form>
                <div className="mt-6 text-center pt-6 border-t border-white/5"><p className="text-slate-400 text-sm">Už máte účet? <Link to="/login" className="text-blue-400 font-bold hover:underline">Přihlásit se</Link></p></div>
            </div>
        </div>
    )
}
export default Register