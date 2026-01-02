import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Calendar, MapPin, Clock, ArrowLeft, Users, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

function DetailAkce() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user, profil, isAdmin } = useAuth()

    const [akce, setAkce] = useState(null)
    const [loading, setLoading] = useState(true)
    const [prihlaska, setPrihlaska] = useState(null) // Moje přihláška
    const [ucastnici, setUcastnici] = useState([]) // Seznam všech (jen pro admina)
    const [loadingAction, setLoadingAction] = useState(false)

    useEffect(() => {
        fetchDetail()
    }, [id, user])

    const fetchDetail = async () => {
        setLoading(true)
        try {
            // 1. Načíst detail akce
            const { data: akceData, error: akceError } = await supabase
                .from('akce')
                .select('*')
                .eq('id', id)
                .single()

            if (akceError) throw akceError
            setAkce(akceData)

            // 2. Načíst moji přihlášku (pokud jsem přihlášen)
            if (profil) {
                const { data: myReg, error: myRegError } = await supabase
                    .from('prihlasky')
                    .select('*')
                    .eq('akce_id', id)
                    .eq('osoba_id', profil.id)
                    .maybeSingle()

                if (!myRegError) setPrihlaska(myReg)
            }

            // 3. Načíst všechny účastníky (pokud jsem admin)
            if (isAdmin) {
                const { data: allRegs, error: allRegsError } = await supabase
                    .from('prihlasky')
                    .select('*, osoby(jmeno, prijmeni, foto_url, kluby(nazev))')
                    .eq('akce_id', id)

                if (!allRegsError) setUcastnici(allRegs)
            }

        } catch (error) {
            console.error('Chyba:', error)
            toast.error('Chyba načítání detailu')
            navigate('/akce')
        } finally {
            setLoading(false)
        }
    }

    const handlePrihlasit = async () => {
        if (!profil) return toast.error('Musíte mít spárovaný profil!')
        setLoadingAction(true)
        try {
            const { error } = await supabase
                .from('prihlasky')
                .insert([{ akce_id: id, osoba_id: profil.id, status: 'prihlasen' }])

            if (error) throw error
            toast.success('Úspěšně přihlášeno!')
            fetchDetail() // Refresh
        } catch (error) {
            console.error(error)
            toast.error('Chyba přihlášení')
        } finally {
            setLoadingAction(false)
        }
    }

    const handleOdhlasit = async () => {
        if (!window.confirm('Opravdu se chcete odhlásit?')) return
        setLoadingAction(true)
        try {
            const { error } = await supabase
                .from('prihlasky')
                .delete()
                .eq('id', prihlaska.id)

            if (error) throw error
            toast.success('Odhlášeno')
            setPrihlaska(null)
            fetchDetail()
        } catch (error) {
            console.error(error)
            toast.error('Chyba odhlášení')
        } finally {
            setLoadingAction(false)
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-500 w-10 h-10" /></div>
    if (!akce) return null

    const isFull = akce.kapacita && (ucastnici.length >= akce.kapacita) // Zjednodušené (pro usera nemáme count, ale to nevadí pro MVP)
    const isPast = new Date(akce.datum_od) < new Date()

    return (
        <div className="max-w-4xl mx-auto p-4 pb-32 pt-8 page-enter">
            <button onClick={() => navigate('/akce')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                <ArrowLeft className="w-5 h-5" /> Zpět na kalendář
            </button>

            <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 mb-8">
                {/* Header s barvou podle typu */}
                <div className={`h-32 w-full relative overflow-hidden ${akce.typ === 'skoleni' ? 'bg-blue-900/40' :
                        akce.typ === 'seminar' ? 'bg-purple-900/40' :
                            'bg-slate-800'
                    }`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent"></div>
                    <div className="absolute bottom-6 left-6 md:left-10">
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-white/10 text-white border border-white/10 mb-2 inline-block">
                            {akce.typ}
                        </span>
                        <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">{akce.nazev}</h1>
                    </div>
                </div>

                <div className="p-6 md:p-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Levý sloupec - Info */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="flex flex-wrap gap-6 text-slate-300">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-lg"><Calendar className="w-5 h-5 text-blue-400" /></div>
                                    <div>
                                        <div className="text-xs text-slate-500 font-bold uppercase">Datum</div>
                                        <div className="font-medium">{new Date(akce.datum_od).toLocaleDateString('cs-CZ')}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/5 rounded-lg"><Clock className="w-5 h-5 text-blue-400" /></div>
                                    <div>
                                        <div className="text-xs text-slate-500 font-bold uppercase">Čas</div>
                                        <div className="font-medium">{new Date(akce.datum_od).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                                {akce.misto && (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/5 rounded-lg"><MapPin className="w-5 h-5 text-blue-400" /></div>
                                        <div>
                                            <div className="text-xs text-slate-500 font-bold uppercase">Místo</div>
                                            <div className="font-medium">{akce.misto}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="prose prose-invert max-w-none">
                                <h3 className="text-white font-bold text-lg mb-2">Popis akce</h3>
                                <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">{akce.popis || 'Bez popisu.'}</p>
                            </div>
                        </div>

                        {/* Pravý sloupec - Akce */}
                        <div className="space-y-4">
                            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-4">
                                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                    <span className="text-slate-400">Kredity</span>
                                    <span className="text-xl font-bold text-yellow-400">{akce.kredity} KR</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                    <span className="text-slate-400">Cena</span>
                                    <span className="text-xl font-bold text-white">{akce.cena ? `${akce.cena} Kč` : 'Zdarma'}</span>
                                </div>

                                {isPast ? (
                                    <div className="p-3 bg-slate-800 rounded-xl text-center text-slate-500 font-bold text-sm">
                                        Akce již proběhla
                                    </div>
                                ) : prihlaska ? (
                                    <div className="space-y-3">
                                        <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-3 text-green-400 font-bold text-sm">
                                            <CheckCircle className="w-5 h-5" /> Jste přihlášen
                                        </div>
                                        <button
                                            onClick={handleOdhlasit}
                                            disabled={loadingAction}
                                            className="w-full py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            {loadingAction ? 'Zpracovávám...' : 'Zrušit přihlášku'}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handlePrihlasit}
                                        disabled={loadingAction || !user}
                                        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${!user ? 'bg-slate-700 cursor-not-allowed opacity-50' :
                                                'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                                            }`}
                                    >
                                        {loadingAction ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Přihlásit se'}
                                    </button>
                                )}
                                {!user && <div className="text-xs text-center text-slate-500">Pro přihlášení se musíte přihlásit.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ADMIN SEKCE - SEZNAM ÚČASTNÍKŮ */}
            {isAdmin && (
                <div className="animate-fadeIn">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" /> Přihlášení účastníci ({ucastnici.length})
                    </h2>
                    <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                        {ucastnici.length === 0 ? (
                            <div className="p-6 text-center text-slate-500">Zatím nikdo.</div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {ucastnici.map(u => (
                                    <div key={u.id} className="p-4 flex items-center justify-between hover:bg-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10">
                                                {u.osoby.foto_url ? <img src={u.osoby.foto_url} className="w-full h-full object-cover" /> : u.osoby.jmeno[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{u.osoby.prijmeni} {u.osoby.jmeno}</div>
                                                <div className="text-xs text-slate-400">{u.osoby.kluby?.nazev || 'Bez klubu'}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default DetailAkce
