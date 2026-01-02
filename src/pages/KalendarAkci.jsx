import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Calendar, MapPin, Clock, Filter, ChevronRight, Loader2, Plus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

function KalendarAkci() {
    const { isAdmin } = useAuth()
    const [akce, setAkce] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterType, setFilterType] = useState('all')

    useEffect(() => {
        fetchAkce()
    }, [])

    const fetchAkce = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('akce')
                .select('*')
                .order('datum_od', { ascending: true })

            if (error) throw error
            setAkce(data || [])
        } catch (error) {
            console.error('Chyba načítání akcí:', error)
            toast.error('Nepodařilo se načíst akce')
        } finally {
            setLoading(false)
        }
    }

    const filteredAkce = filterType === 'all'
        ? akce
        : akce.filter(a => a.typ === filterType)

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('cs-CZ', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    const getTypeColor = (type) => {
        switch (type) {
            case 'skoleni': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
            case 'seminar': return 'text-purple-400 bg-purple-500/10 border-purple-500/20'
            case 'turnaj': return 'text-green-400 bg-green-500/10 border-green-500/20'
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
        }
    }

    const getTypeLabel = (type) => {
        switch (type) {
            case 'skoleni': return 'Školení'
            case 'seminar': return 'Seminář'
            case 'turnaj': return 'Turnaj'
            default: return 'Jiné'
        }
    }

    return (
        <div className="max-w-6xl mx-auto p-4 pb-32 pt-8 page-enter">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 mb-2">
                        <Calendar className="w-8 h-8 text-blue-500" /> Kalendář akcí
                    </h1>
                    <p className="text-slate-400 text-sm">Přehled školení, seminářů a turnajů</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Filtr */}
                    <div className="relative group">
                        <div className="flex items-center gap-2 bg-slate-900/50 border border-white/10 rounded-xl p-1 pr-3">
                            <div className="p-2 bg-white/5 rounded-lg"><Filter className="w-4 h-4 text-slate-400" /></div>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="bg-transparent border-none text-sm text-slate-300 focus:ring-0 cursor-pointer outline-none"
                            >
                                <option value="all">Všechny typy</option>
                                <option value="skoleni">Školení</option>
                                <option value="seminar">Semináře</option>
                                <option value="turnaj">Turnaje</option>
                            </select>
                        </div>
                    </div>

                    {/* Tlačítko pro admina (zatím jen placeholder, funkčnost přidáme později) */}
                    {isAdmin && (
                        <Link to="/akce/nova" className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2 font-bold text-sm">
                            <Plus className="w-5 h-5" /> <span className="hidden md:inline">Nová akce</span>
                        </Link>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 text-slate-500 animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredAkce.length === 0 ? (
                        <div className="p-10 text-center border border-dashed border-white/10 rounded-3xl text-slate-500">
                            Zatím nejsou naplánovány žádné akce.
                        </div>
                    ) : (
                        filteredAkce.map(akce => (
                            <Link
                                key={akce.id}
                                to={`/akce/${akce.id}`}
                                className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all group flex flex-col md:flex-row gap-6 relative overflow-hidden"
                            >
                                {/* Datum Box */}
                                <div className="flex flex-row md:flex-col items-center justify-center gap-2 md:gap-0 bg-slate-900/50 rounded-xl p-3 md:w-24 md:h-24 border border-white/5 shrink-0">
                                    <span className="text-2xl md:text-3xl font-black text-white">
                                        {new Date(akce.datum_od).getDate()}
                                    </span>
                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                        {new Date(akce.datum_od).toLocaleDateString('cs-CZ', { month: 'short' })}
                                    </span>
                                </div>

                                <div className="flex-1 min-w-0 py-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${getTypeColor(akce.typ)}`}>
                                            {getTypeLabel(akce.typ)}
                                        </span>
                                        {akce.kredity > 0 && (
                                            <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md border border-yellow-400/20">
                                                {akce.kredity} KR
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors truncate">
                                        {akce.nazev}
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-slate-500" />
                                            {new Date(akce.datum_od).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        {akce.misto && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4 text-slate-500" />
                                                {akce.misto}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end md:justify-center pl-4 border-l border-white/5">
                                    <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors group-hover:translate-x-1 duration-300" />
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export default KalendarAkci
