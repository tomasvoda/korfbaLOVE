import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Search, MapPin, Filter, Users, Award, Shield, ChevronRight, CheckCircle2, AlertCircle, Plus, Save, Download, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

function SeznamLidi() {
  const [lidi, setLidi] = useState([])
  const [klubyList, setKlubyList] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Stavy
  const [pohled, setPohled] = useState('vse')
  const [hledani, setHledani] = useState('')
  const [filtrKlub, setFiltrKlub] = useState('')
  const [jenPlatne, setJenPlatne] = useState(false)

  // Modál
  const [modalNew, setModalNew] = useState(false)
  const [formNew, setFormNew] = useState({ jmeno: '', prijmeni: '', klub_id: '' })
  const [savingNew, setSavingNew] = useState(false)

  useEffect(() => {
    nacistData()
  }, [])

  async function nacistData() {
    setLoading(true)
    const { data: dataLidi } = await supabase.from('osoby').select('*, kluby(id, nazev), licence(*)').order('prijmeni')
    const { data: dataKluby } = await supabase.from('kluby').select('id, nazev').order('nazev')
    setLidi(dataLidi || [])
    setKlubyList(dataKluby || [])
    setLoading(false)
  }

  // --- 1. POMOCNÉ FUNKCE ---
  const cleanKlub = (n) => n ? n.replace(/,\s*z\.s\./i, '').replace(/spolek/i, '').trim() : 'Bez klubu'
  const dateFmt = (d) => d ? new Date(d).toLocaleDateString('cs-CZ') : ''

  // --- 2. LOGIKA FILTROVÁNÍ ---
  const filtrovanaData = lidi.filter(osoba => {
    const full = `${osoba.jmeno} ${osoba.prijmeni}`.toLowerCase()
    const matchText = full.includes(hledani.toLowerCase()) && (osoba.kluby?.nazev || '').toLowerCase().includes(filtrKlub.toLowerCase())
    if (!matchText) return false

    const roleTarget = pohled === 'treneri' ? 'Trenér' : (pohled === 'rozhodci' ? 'Rozhodčí' : null)
    if (jenPlatne) {
        const maPlatnouLicenci = osoba.licence?.some(l => {
            const jeAktivni = l.aktivni
            const jeVBudoucnu = l.platnost_do && new Date(l.platnost_do) > new Date()
            if (pohled === 'vse') return jeAktivni && jeVBudoucnu
            else return jeAktivni && jeVBudoucnu && l.typ_role === roleTarget
        })
        if (!maPlatnouLicenci) return false
    }
    return true
  })

  // --- 3. LOGIKA SESKUPOVÁNÍ ---
  const getGroupedData = (role) => {
      const typRole = role === 'treneri' ? 'Trenér' : 'Rozhodčí'
      const skupiny = {}
      filtrovanaData.forEach(osoba => {
          const licenceOsoby = osoba.licence?.filter(l => l.typ_role === typRole && l.aktivni) || []
          const finalLicence = jenPlatne ? licenceOsoby.filter(l => l.platnost_do && new Date(l.platnost_do) > new Date()) : licenceOsoby
          finalLicence.forEach(lic => {
              const uroven = lic.uroven || 'Neurčeno'
              if (!skupiny[uroven]) skupiny[uroven] = []
              skupiny[uroven].push({ osoba, licence: lic })
          })
      })
      return Object.keys(skupiny).sort().map(uroven => ({
          uroven, polozky: skupiny[uroven].sort((a,b) => a.osoba.prijmeni.localeCompare(b.osoba.prijmeni))
      }))
  }

  // --- 4. EXPORT DO CSV ---
  const exportDoCSV = () => {
      const dataKExportu = pohled === 'vse' ? filtrovanaData : getGroupedData(pohled).flatMap(g => g.polozky.map(p => p.osoba))
      
      if (dataKExportu.length === 0) {
          toast.error("Žádná data k exportu.")
          return
      }

      let csvContent = "Příjmení;Jméno;Klub;Role;Licence\n"

      dataKExportu.forEach(osoba => {
          const klub = cleanKlub(osoba.kluby?.nazev)
          const licenceText = osoba.licence
            ?.filter(l => l.aktivni)
            .map(l => `${l.typ_role} ${l.uroven} (do ${l.platnost_do ? dateFmt(l.platnost_do) : '?'})`)
            .join(", ") || ""

          let role = []
          if (osoba.je_trener) role.push("Trenér")
          if (osoba.je_rozhodci) role.push("Rozhodčí")
          if (role.length === 0) role.push("Člen")

          const radek = `${osoba.prijmeni};${osoba.jmeno};${klub};${role.join(", ")};${licenceText}`
          csvContent += radek + "\n"
      })

      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `evidence_cks_${new Date().toISOString().slice(0,10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success(`Exportováno ${dataKExportu.length} osob.`)
  }

  // --- 5. OSTATNÍ FUNKCE ---
  const vytvoritClena = async () => {
      if (!formNew.jmeno || !formNew.prijmeni) {
          toast.error('Vyplňte jméno a příjmení.')
          return
      }
      setSavingNew(true)
      try {
          const { error } = await supabase.from('osoby').insert([{
              jmeno: formNew.jmeno, prijmeni: formNew.prijmeni, klub_id: formNew.klub_id || null, 
              email: '', je_trener: false, je_rozhodci: false
          }])
          if (error) throw error
          
          await nacistData()
          setModalNew(false)
          setFormNew({ jmeno: '', prijmeni: '', klub_id: '' })
          toast.success('Člen úspěšně vytvořen!')
      } catch (err) {
          toast.error('Chyba: ' + err.message)
      } finally {
          setSavingNew(false)
      }
  }

  return (
    <div className="min-h-screen p-4 md:p-10 pb-32">
      
      {/* HLAVIČKA */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="text-center md:text-left">
               <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">Evidence licencí ČKS</h1>
               <p className="text-slate-400 font-medium">Portál správy licencí</p>
           </div>
           
           <div className="flex gap-3">
               <button onClick={exportDoCSV} className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-2xl border border-white/10 font-bold transition-all" title="Stáhnout CSV">
                   <Download className="w-5 h-5"/> <span className="hidden sm:inline">Export</span>
               </button>
               <button onClick={() => setModalNew(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20 font-bold transition-all">
                   <Plus className="w-5 h-5"/> Nový člen
               </button>
           </div>
      </div>

      {/* MENU */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-center">
          <div className="bg-slate-900/60 backdrop-blur-md p-1.5 rounded-2xl inline-flex flex-wrap justify-center border border-white/10 shadow-xl gap-1">
              {[ { id: 'vse', icon: Users, label: 'Všichni' }, { id: 'treneri', icon: Award, label: 'Trenéři' }, { id: 'rozhodci', icon: Shield, label: 'Rozhodčí' } ].map(item => (
                <button key={item.id} type="button" onClick={() => setPohled(item.id)} className={`px-4 md:px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${pohled===item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                    <item.icon className="w-4 h-4"/> {item.label}
                </button>
              ))}
          </div>
      </div>

      {/* FILTRY */}
      <div className="sticky top-4 z-40 max-w-7xl mx-auto mb-8">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col md:flex-row gap-2 items-stretch">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="relative group">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                    <input type="text" placeholder="Hledat osobu..." className="w-full bg-white/5 hover:bg-white/10 focus:bg-slate-800 border border-transparent focus:border-blue-500/50 rounded-xl py-3 pl-12 text-white placeholder-slate-500 focus:outline-none transition-all" value={hledani} onChange={e => setHledani(e.target.value)} />
                </div>
                <div className="relative group">
                    <MapPin className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                    <input type="text" placeholder="Filtrovat klub..." className="w-full bg-white/5 hover:bg-white/10 focus:bg-slate-800 border border-transparent focus:border-blue-500/50 rounded-xl py-3 pl-12 text-white placeholder-slate-500 focus:outline-none transition-all" value={filtrKlub} onChange={e => setFiltrKlub(e.target.value)} />
                </div>
              </div>
              <button onClick={() => setJenPlatne(!jenPlatne)} className={`px-4 py-3 rounded-xl border flex items-center gap-2 font-bold text-sm transition-all whitespace-nowrap ${jenPlatne ? 'bg-green-600/20 border-green-500/50 text-green-400' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}>
                  {jenPlatne ? <CheckCircle2 className="w-5 h-5"/> : <div className="w-5 h-5 rounded-full border-2 border-slate-500"/>} Jen aktivní
              </button>
          </div>
      </div>

      {loading ? (
          <div className="flex justify-center pt-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
          <>
            {pohled === 'vse' && (
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtrovanaData.map((osoba) => {
                    const displayLicences = osoba.licence?.filter(l => l.aktivni && (!jenPlatne || (l.platnost_do && new Date(l.platnost_do) > new Date()))) || []
                    return (
                    <Link key={osoba.id} to={`/osoba/${osoba.id}`} className="group block h-full">
                        <div className="h-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 hover:bg-white/10 hover:scale-[1.02] hover:shadow-2xl transition-all duration-500 flex flex-col relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-5 relative z-10">
                                <div className="shrink-0">
                                {osoba.foto_url ? <img src={osoba.foto_url} className="w-14 h-14 rounded-full object-cover border-2 border-white/10 shadow-lg" /> : <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-white/10 flex items-center justify-center text-lg font-bold text-white">{osoba.jmeno?.[0]}{osoba.prijmeni?.[0]}</div>}
                                </div>
                                <div className="min-w-0">
                                <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-200 transition-colors">{osoba.prijmeni} {osoba.jmeno}</h3>
                                <div className="text-xs font-medium text-slate-400 mt-1 truncate flex items-center gap-1"><MapPin className="w-3 h-3"/> {cleanKlub(osoba.kluby?.nazev)}</div>
                                </div>
                            </div>
                            <div className="space-y-2 mb-2 flex-1 relative z-10">
                                {displayLicences.slice(0, 3).map(l => {
                                    const isOk = l.platnost_do && new Date(l.platnost_do) > new Date()
                                    const clr = l.typ_role === 'Trenér' ? 'blue' : 'red'
                                    return (
                                        <div key={l.id} className={`flex justify-between items-center px-3 py-2 rounded-xl border text-xs bg-${clr}-500/10 border-${clr}-500/20 text-${clr}-200`}>
                                            <div className="flex flex-col">
                                                <span className="font-bold uppercase">{l.typ_role} {l.uroven}</span>
                                                <span className={`text-[10px] ${isOk?'text-white/60':'text-red-400 font-bold'}`}>{l.platnost_do ? `Platí do: ${dateFmt(l.platnost_do)}` : 'Bez data'}</span>
                                            </div>
                                            {isOk ? <CheckCircle2 className="w-4 h-4 opacity-60"/> : <AlertCircle className="w-4 h-4 text-red-500"/>}
                                        </div>
                                    )
                                })}
                                {displayLicences.length === 0 && <div className="text-xs uppercase font-bold text-slate-600 mt-4 self-end">Člen bez funkce</div>}
                            </div>
                        </div>
                    </Link>
                    )
                })}
                </div>
            )}

            {(pohled === 'treneri' || pohled === 'rozhodci') && (
                <div className="max-w-5xl mx-auto">
                    {getGroupedData(pohled).map((skupina) => (
                        <div key={skupina.uroven} className="mb-10 animate-fadeIn">
                            <div className="flex items-center gap-4 mb-4">
                                <h2 className="text-2xl font-bold text-white">Úroveň {skupina.uroven}</h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
                                <span className="text-sm font-bold text-slate-500">{skupina.polozky.length} osob</span>
                            </div>
                            <div className="bg-slate-900/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
                                {skupina.polozky.map(({ osoba, licence }, index) => {
                                    const isPlatna = licence.platnost_do && new Date(licence.platnost_do) > new Date()
                                    return (
                                        // ZDE BYL PROBLÉM - ODSTRANĚNO "BLOCK", PONECHÁNO "FLEX"
                                        <Link key={licence.id} to={`/osoba/${osoba.id}`} className={`p-4 hover:bg-white/5 transition-colors flex items-center justify-between group ${index !== skupina.polozky.length-1 ? 'border-b border-white/5' : ''}`}>
                                            <div className="flex items-center gap-4">
                                                {osoba.foto_url ? <img src={osoba.foto_url} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-white">{osoba.jmeno[0]}{osoba.prijmeni[0]}</div>}
                                                <div>
                                                    <div className="font-bold text-white group-hover:text-blue-300 transition-colors">{osoba.prijmeni} {osoba.jmeno}</div>
                                                    <div className="text-xs text-slate-400">{cleanKlub(osoba.kluby?.nazev)}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right hidden sm:block">
                                                    <div className="text-xs text-slate-500 uppercase font-bold">Platnost</div>
                                                    <div className={`text-sm font-medium ${isPlatna ? 'text-green-400' : 'text-red-400'}`}>{licence.platnost_do ? dateFmt(licence.platnost_do) : 'Bez data'}</div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                    {getGroupedData(pohled).length === 0 && <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl">{jenPlatne ? 'Žádné aktivní licence pro tuto kategorii.' : 'Žádné záznamy.'}</div>}
                </div>
            )}
          </>
      )}

      {modalNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
                  <button onClick={() => setModalNew(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X/></button>
                  <h3 className="text-xl font-bold text-white mb-6">Založit nového člena</h3>
                  <div className="space-y-4">
                      <div><label className="text-xs text-slate-400 uppercase font-bold">Jméno</label><input type="text" className="w-full bg-slate-800 border border-transparent focus:border-blue-500 rounded-xl p-3 text-white mt-1" value={formNew.jmeno} onChange={e => setFormNew({...formNew, jmeno: e.target.value})}/></div>
                      <div><label className="text-xs text-slate-400 uppercase font-bold">Příjmení</label><input type="text" className="w-full bg-slate-800 border border-transparent focus:border-blue-500 rounded-xl p-3 text-white mt-1" value={formNew.prijmeni} onChange={e => setFormNew({...formNew, prijmeni: e.target.value})}/></div>
                      <div>
                          <label className="text-xs text-slate-400 uppercase font-bold">Klub</label>
                          <div className="relative mt-1">
                            <select className="w-full bg-slate-800 border border-transparent focus:border-blue-500 rounded-xl p-3 text-white appearance-none" value={formNew.klub_id} onChange={e => setFormNew({...formNew, klub_id: e.target.value})}>
                                <option value="">-- Bez klubu / Vybrat --</option>
                                {klubyList.map(klub => (<option key={klub.id} value={klub.id}>{klub.nazev}</option>))}
                            </select>
                          </div>
                      </div>
                  </div>
                  <div className="mt-8">
                      <button onClick={vytvoritClena} disabled={savingNew} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">{savingNew ? 'Ukládám...' : <><Save className="w-5 h-5"/> Vytvořit</>}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  )
}

export default SeznamLidi