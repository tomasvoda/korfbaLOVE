import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { Link } from 'react-router-dom'
import { Search, Shield, SlidersHorizontal, Check, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext' // IMPORT NOVÉHO KONTEXTU
import toast from 'react-hot-toast'

const PORADI_UROVNI = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'Mezinárodní': 1, 'Národní': 2, 'Neurčeno': 99 }

function SeznamOsob() {
    const { user, profil } = useAuth()
    
    // --- ZMĚNA: TADY UŽ NESTAHUJEME, ALE BEREME Z PAMĚTI ---
    const { osoby, loading, fetchOsoby } = useData() 
    // -------------------------------------------------------

    const [search, setSearch] = useState('')
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [filterRole, setFilterRole] = useState('all') 
    const [onlyActive, setOnlyActive] = useState(true)
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const filterRef = useRef(null)

    // Funkce pro manuální refresh tlačítkem
    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchOsoby(true) // Force true = vynutit stažení
        setIsRefreshing(false)
    }
    
    // Zbytek logiky (forcePair, filtry, SkeletonCard, OsobaCard) zůstává STEJNÝ...
    // Jen smažte ten starý `useEffect` s `fetchData`, ten už dělá DataContext.
    
    // (Zde pro jistotu uvádím zkrácenou verzi renderu, aby bylo vidět, kam napojit handleRefresh)

    // ... forcePair ...
    const forcePair = async () => { /* ... stejný kód ... */ }

    useEffect(() => {
        const handleClickOutside = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setIsFilterOpen(false) }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])
    
    // Skeleton a OsobaCard komponenty sem vložte stejné jako minule...
    const SkeletonCard = () => (
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 border border-white/5">
             <div className="w-12 h-12 rounded-full bg-slate-800 animate-pulse shrink-0"></div>
             <div className="flex-1 space-y-2"><div className="h-4 bg-slate-800 rounded w-1/2"></div></div>
        </div>
    )

    const OsobaCard = ({ osoba, showFullTags = false }) => {
        const licenceKZobrazeni = showFullTags && osoba.displayLicence 
            ? [osoba.displayLicence] 
            : osoba.licence?.filter(l => onlyActive ? l.aktivni : true).sort((a, b) => a.typ_role.localeCompare(b.typ_role)) || []

        return (
            <Link to={`/osoba/${osoba.id}`} className="glass-panel p-4 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-all group border border-white/5 hover:border-white/20 hover:scale-[1.01] hover:shadow-xl">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-blue-500/50 transition-colors shrink-0">
                    {osoba.foto_url ? <img src={osoba.foto_url} className="w-full h-full object-cover"/> : <span className="font-bold text-slate-500">{osoba.jmeno[0]}{osoba.prijmeni[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-white font-bold truncate">{osoba.prijmeni} {osoba.jmeno}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 truncate mb-2">
                        <Shield className="w-3 h-3 text-slate-600"/> {osoba.kluby?.nazev || 'Bez klubu'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {licenceKZobrazeni.map(lic => (
                            <div key={lic.id} className={`flex items-center gap-2 px-2 py-1 rounded-md border text-[10px] ${lic.typ_role === 'Trenér' ? 'bg-blue-500/5 border-blue-500/20 text-blue-300' : 'bg-red-500/5 border-red-500/20 text-red-300'}`}>
                                <span className="font-bold uppercase tracking-wider opacity-90">{lic.typ_role}</span>
                                <span className="font-black text-xs">{lic.uroven}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </Link>
        )
    }

    // Výpočet dat (Memo)
    const zpracovanaData = useMemo(() => {
        let filtered = osoby.filter(o => {
            const fullText = `${o.jmeno} ${o.prijmeni} ${o.kluby?.nazev || ''}`.toLowerCase()
            const matchesSearch = fullText.includes(search.toLowerCase())
            let matchesActive = true; if (onlyActive) matchesActive = o.licence.some(l => l.aktivni);
            return matchesSearch && matchesActive
        })

        if (filterRole !== 'all') {
            const groups = {}
            const roleName = filterRole === 'trener' ? 'Trenér' : 'Rozhodčí'
            filtered.forEach(osoba => {
                const licence = osoba.licence.find(l => l.typ_role === roleName && (onlyActive ? l.aktivni : true))
                if (licence) {
                    const uroven = licence.uroven || 'Neurčeno'; if (!groups[uroven]) groups[uroven] = [];
                    groups[uroven].push({ ...osoba, displayLicence: licence })
                }
            })
            const sortedKeys = Object.keys(groups).sort((a, b) => (PORADI_UROVNI[a] || 99) - (PORADI_UROVNI[b] || 99))
            return { mode: 'grouped', data: groups, keys: sortedKeys }
        }
        return { mode: 'flat', data: filtered }
    }, [osoby, search, filterRole, onlyActive])


    return (
        <div className="max-w-6xl mx-auto p-4 pb-32 pt-8">
            {/* ... Záchranné tlačítko a hlavička stejné ... */}
            
            <div className="mb-6 text-left">
                <h1 className="text-3xl font-black text-white leading-none mb-2">Databáze ČKS</h1>
                <p className="text-slate-400 text-sm font-medium">Centrální evidence trenérů a rozhodčích</p>
            </div>

            <div className="sticky top-0 z-30 -mx-4 px-4 py-4 bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/5 transition-all shadow-2xl mb-6">
                <div className="flex gap-2 w-full relative" ref={filterRef}>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3.5 text-slate-500 w-5 h-5"/>
                        <input type="text" placeholder="Hledat..." className="glass-input w-full p-3 pl-10 rounded-xl bg-slate-900/50 focus:bg-slate-900 transition-colors" value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    
                    {/* UPRAVENÉ TLAČÍTKO REFRESH */}
                    <button onClick={handleRefresh} className={`p-3 rounded-xl border border-white/10 glass-input bg-slate-900/50 hover:bg-slate-800 text-slate-300 transition-all ${isRefreshing ? 'animate-spin text-blue-400' : ''}`}>
                        <RefreshCw className="w-5 h-5"/>
                    </button>

                    <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`p-3 rounded-xl border transition-all flex items-center gap-2 ${isFilterOpen || filterRole !== 'all' ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'glass-input bg-slate-900/50 hover:bg-slate-800 text-slate-300'}`}>
                        <SlidersHorizontal className="w-5 h-5"/>
                    </button>
                    {/* ... Dropdown filtrů stejný ... */}
                    {isFilterOpen && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn ring-1 ring-black/50">
                             <div className="flex justify-between items-center mb-4"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Zobrazit roli</span>{filterRole !== 'all' && <button onClick={() => setFilterRole('all')} className="text-xs text-blue-400 hover:text-white">Reset</button>}</div>
                             <div className="space-y-1 mb-6">
                                <button onClick={() => setFilterRole('all')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${filterRole === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5'}`}>Všechny osoby {filterRole === 'all' && <Check className="w-4 h-4 text-blue-400"/>}</button>
                                <button onClick={() => setFilterRole('trener')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${filterRole === 'trener' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-white/5'}`}>Trenéři {filterRole === 'trener' && <Check className="w-4 h-4"/>}</button>
                                <button onClick={() => setFilterRole('rozhodci')} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${filterRole === 'rozhodci' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-400 hover:bg-white/5'}`}>Rozhodčí {filterRole === 'rozhodci' && <Check className="w-4 h-4"/>}</button>
                             </div>
                             <div className="pt-4 border-t border-white/10">
                                <div className="flex items-center justify-between cursor-pointer" onClick={() => setOnlyActive(!onlyActive)}>
                                    <span className="text-sm text-slate-300">Pouze aktivní licence</span>
                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${onlyActive ? 'bg-green-500' : 'bg-slate-700'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${onlyActive ? 'translate-x-4' : 'translate-x-0'}`}></div></div>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RENDER - ZDE SE POUŽÍVÁ LOADING Z DATA CONTEXTU */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                </div>
            ) : zpracovanaData.mode === 'flat' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    {zpracovanaData.data.map(osoba => <OsobaCard key={osoba.id} osoba={osoba} />)}
                    {zpracovanaData.data.length === 0 && <div className="col-span-full py-20 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl">Nikdo nebyl nalezen.</div>}
                </div>
            ) : (
                <div className="space-y-8 pt-2">
                    {zpracovanaData.keys.map(uroven => (
                        <div key={uroven} className="animate-fadeIn scroll-mt-32">
                             <div className="flex items-center gap-3 mb-4 sticky top-24 z-20 bg-[#0f172a] py-2 w-fit pr-4 rounded-r-xl border-y border-r border-white/5 shadow-xl md:static md:bg-transparent md:border-none md:shadow-none">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2"><span className={`w-2 h-8 rounded-full ${filterRole === 'trener' ? 'bg-blue-500' : 'bg-red-500'}`}></span>Třída {uroven}</h2>
                                <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-md">{zpracovanaData.data[uroven].length}</span>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {zpracovanaData.data[uroven].map(osoba => <OsobaCard key={osoba.id} osoba={osoba} showFullTags={true} />)}
                             </div>
                        </div>
                    ))}
                    {zpracovanaData.keys.length === 0 && <div className="py-20 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl">V této roli nikdo neodpovídá zadání.</div>}
                </div>
            )}
        </div>
    )
}

export default SeznamOsob