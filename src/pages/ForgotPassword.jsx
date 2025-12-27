import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)

    const handleReset = async (e) => {
        e.preventDefault()
        setLoading(true)
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/update-password',
        })

        if (error) {
            toast.error(error.message)
        } else {
            toast.success("E-mail odeslán! Zkontrolujte schránku.")
            setEmail('')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 page-enter">
            <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-white/10 relative bg-[#0f172a]/50">
                <Link to="/login" className="absolute top-6 left-6 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6"/>
                </Link>
                
                <div className="text-center mb-8 mt-4">
                    <h1 className="text-2xl font-black text-white mb-2">Obnova hesla</h1>
                    <p className="text-slate-400 text-sm">Zadejte e-mail a my vám pošleme instrukce.</p>
                </div>

                <form onSubmit={handleReset} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-slate-500 w-5 h-5"/>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 pl-12 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-slate-500"
                            placeholder="vas@email.cz"
                        />
                    </div>

                    <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Odeslat instrukce'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default ForgotPassword