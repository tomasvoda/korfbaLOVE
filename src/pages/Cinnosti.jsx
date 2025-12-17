import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { MapPin, Clock, Briefcase, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAktualniSezona } from '../utils/dateUtils'

function Cinnosti() {
  const [cinnosti, setCinnosti] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtrSezona, setFiltrSezona] = useState('')

  useEffect(() => {
      const fetchCinnosti = async () => {
          setLoading(true)
          const { data, error } = await supabase
            .from('cinnosti')
            .select('*, osoby(id, jmeno, prijmeni, foto_url)')
            .order('created_at', { ascending: false })
          
          if (error) console.error('Chyba DB:', error)
          else setCinnosti(data || [])
          
          setLoading(false)
      }
      fetchCinnosti()
  }, [])

  const dnyNazvy = ['?', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

  const sezonyDostupne = useMemo(() => {
      return Array.from(new Set(
          cinnosti.map(c => c.sezona).filter(Boolean)
      )).sort((a, b) => b.localeCompare(a))
  }, [cinnosti])

  useEffect(() => {
      if (!sezonyDostupne.length) {
          if (filtrSezona) setFiltrSezona('')
          return
      }
      if (!sezonyDostupne.includes(filtrSezona)) {
          const aktualni = getAktualniSezona().nazev
          const vyber = sezonyDostupne.includes(aktualni) ? aktualni : sezonyDostupne[0]
          setFiltrSezona(vyber)
      }
  }, [sezonyDostupne, filtrSezona])

  const cinnostiFiltrovane = filtrSezona ? cinnosti.filter(c => c.sezona === filtrSezona) : cinnosti

  const formatDen = (denVTydnu) => {
      const values = Array.isArray(denVTydnu) ? denVTydnu : [denVTydnu]
      return values
        .map(val => {
            const idx = parseInt(val, 10)
            return dnyNazvy[idx] || '?'
        })
        .filter(Boolean)
        .join(', ')
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32">
        <div className="max-w-7xl mx-auto mb-8 glass-panel p-6 rounded-3xl relative overflow-hidden">
            <div className="relative z-10">
                <h1 className="text-3xl font-extrabold text-white mb-1 flex items-center gap-3">
                    Přehled činností
                </h1>
                <p className="text-slate-400 font-medium">Centrální rozpis tréninků a aktivit</p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
            {sezonyDostupne.length > 0 && (
                <div className="mt-6 flex gap-2 overflow-x-auto pb-1 mask-fade hide-scrollbar">
                    {sezonyDostupne.map(sezona => (
                        <button 
                            key={sezona} 
                            onClick={() => setFiltrSezona(sezona)} 
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filtrSezona === sezona ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                        >
                            {sezona}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {loading ? (
            <div className="text-center text-slate-500 py-20 flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                Načítám data...
            </div>
        ) : (
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {cinnostiFiltrovane.map(akt => {
                    const denNazev = formatDen(akt.den_v_tydnu)
                    return (
                    <Link key={akt.id} to={`/osoba/${akt.osoby?.id}`} className="block group h-full">
                        <div className="h-full glass-panel p-5 rounded-3xl flex flex-col justify-between hover:border-blue-500/30 hover:bg-slate-800/60 transition-all relative overflow-hidden">
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${akt.role === 'Trenér' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                            <div>
                                <div className="flex items-center gap-3 mb-4 pl-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-white/10 shrink-0">
                                        {akt.osoby?.foto_url ? (
                                            <img src={akt.osoby.foto_url} className="w-full h-full object-cover"/>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">{akt.osoby?.jmeno?.[0]}</div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">{akt.osoby?.jmeno} {akt.osoby?.prijmeni}</div>
                                        <div className={`text-[10px] font-bold uppercase tracking-wider ${akt.role==='Trenér'?'text-blue-400':'text-purple-400'}`}>{akt.role}</div>
                                    </div>
                                </div>
                                <div className="pl-2 mb-4">
                                    <div className="text-2xl font-black text-white mb-1">{akt.kategorie}</div>
                                    <div className="text-xs text-slate-400 font-bold uppercase flex items-center gap-2">
                                        <span className="bg-white/5 px-2 py-1 rounded-lg border border-white/5">{denNazev}</span>
                                    </div>
                                </div>
                                <div className="pl-2 space-y-2">
                                    <div className="text-sm text-white font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400"/> {akt.cas_od?.slice(0,5)} - {akt.cas_do?.slice(0,5)}</div>
                                    {/* Google Maps Link */}
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(akt.lokace)}`} onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" className="text-xs text-slate-400 flex items-center gap-2 truncate hover:text-blue-300">
                                        <MapPin className="w-4 h-4 text-slate-500"/> {akt.lokace}
                                    </a>
                                </div>
                            </div>
                            <div className="mt-5 pt-3 border-t border-white/5 flex justify-between items-center pl-2">
                                <span className="text-[10px] text-slate-500 font-bold">{akt.sezona}</span>
                                <div className="flex items-center gap-1 text-xs font-bold text-blue-200 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
                                    <span>{akt.celkem_kreditu || 0} kreditů</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                )})}
                {cinnosti.length === 0 && (
                    <div className="col-span-full text-center py-20 text-slate-500 border border-dashed border-white/10 rounded-3xl bg-slate-900/20"><Briefcase className="w-10 h-10 mx-auto mb-4 opacity-50"/><p>Zatím nebyly vytvořeny žádné činnosti.</p></div>
                )}
            </div>
        )}
    </div>
  )
}

export default Cinnosti
