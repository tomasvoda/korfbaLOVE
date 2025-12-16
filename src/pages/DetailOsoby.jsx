import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { 
  ArrowLeft, Mail, Phone, Shield, Camera, Edit2, 
  FileText, Calendar, Download, CheckCircle, AlertTriangle, Upload, RefreshCw, Plus, Trash2, Clock, X, HelpCircle 
} from 'lucide-react'
import toast from 'react-hot-toast'

function DetailOsoby() {
  const { id } = useParams()
  const [osoba, setOsoba] = useState(null)
  
  // Stavy UI
  const [modalProfil, setModalProfil] = useState(false)
  const [modalLicence, setModalLicence] = useState(false)
  
  // NOVÉ: Stav pro potvrzovací okno (nahrazuje window.confirm)
  const [potvrzovac, setPotvrzovac] = useState(null) // { title: '', desc: '', action: () => {}, type: 'danger' | 'info' }

  // Data formulářů
  const [formOsoba, setFormOsoba] = useState({})
  const [formLicence, setFormLicence] = useState({ typ_role: 'Trenér', uroven: 'C', aktivni: true })
  
  const [loading, setLoading] = useState(false)

  useEffect(() => { nacist() }, [id])

  const nacist = async () => {
    const { data } = await supabase.from('osoby').select('*, kluby(nazev), licence(*)').eq('id', id).single()
    if(data) { setOsoba(data); setFormOsoba(data) }
  }

  // --- LOGIKA: Spuštění potvrzovacího okna ---
  const otevritPotvrzeni = (title, desc, action, type = 'info') => {
      setPotvrzovac({ title, desc, action, type })
  }

  // --- LOGIKA: Akce (upravené pro nové potvrzování) ---
  
  // 1. Prodloužení
  const logikaProdlouzeni = async (licence) => {
      const aktualniRok = new Date().getFullYear()
      const maxPovolenyRok = aktualniRok + 1
      let rokZaklad = licence.platnost_do ? new Date(licence.platnost_do).getFullYear() : aktualniRok
      const novyRok = rokZaklad + 1

      if (novyRok > maxPovolenyRok) {
          toast.error(`Nelze prodloužit dál než do roku ${maxPovolenyRok}`)
          return
      }
      
      // Místo confirm() rovnou voláme naše okno
      otevritPotvrzeni(
          'Prodloužit licenci?', 
          `Opravdu chcete prodloužit licenci ${licence.typ_role} o 1 rok (do 30.6.${novyRok})?`,
          async () => {
              const promise = supabase.from('licence').update({ platnost_do: `${novyRok}-06-30` }).eq('id', licence.id)
              await toast.promise(promise, { loading: 'Prodlužuji...', success: 'Prodlouženo!', error: 'Chyba' })
              nacist()
              setPotvrzovac(null) // Zavřít okno
          },
          'info' // Modrý styl
      )
  }

  // 2. Mazání
  const logikaMazani = (licenceId) => {
      otevritPotvrzeni(
          'Smazat licenci?',
          'Tato akce je nevratná. Záznam o licenci bude trvale odstraněn.',
          async () => {
              const promise = supabase.from('licence').delete().eq('id', licenceId)
              await toast.promise(promise, { loading: 'Mažu...', success: 'Smazáno!', error: 'Chyba' })
              nacist()
              setPotvrzovac(null)
          },
          'danger' // Červený styl
      )
  }

  // ... (Zbytek logiky zůstává stejný) ...
  const zmenaDataZiskani = (e) => {
      const datum = e.target.value
      let novaPlatnost = formLicence.platnost_do
      if (formLicence.typ_role === 'Trenér' && datum) {
          const d = new Date(datum)
          let rok = d.getFullYear()
          if (d < new Date('2022-12-27')) rok = 2022
          novaPlatnost = `${rok + 3}-06-30`
      }
      setFormLicence({...formLicence, datum_ziskani: datum, platnost_do: novaPlatnost})
  }

  const ulozitProfil = async () => {
     setLoading(true)
     try {
        await supabase.from('osoby').update({
            email: formOsoba.email, telefon: formOsoba.telefon, foto_url: formOsoba.foto_url,
            je_trener: formOsoba.je_trener, je_rozhodci: formOsoba.je_rozhodci
        }).eq('id', id)
        await nacist(); setModalProfil(false); toast.success('Profil uložen')
     } catch (err) { toast.error('Chyba') } finally { setLoading(false) }
  }

  const ulozitLicenci = async () => {
      setLoading(true)
      const payload = {
          osoba_id: id, typ_role: formLicence.typ_role, uroven: formLicence.uroven,
          datum_ziskani: formLicence.datum_ziskani, platnost_do: formLicence.platnost_do,
          certifikat_url: formLicence.certifikat_url, aktivni: true
      }
      try {
          if(formLicence.id) await supabase.from('licence').update(payload).eq('id', formLicence.id)
          else await supabase.from('licence').insert([payload])
          await nacist(); setModalLicence(false); toast.success('Uloženo')
      } catch (err) { toast.error('Chyba') } finally { setLoading(false) }
  }

  const upload = async (e, bucket, cb) => {
      const f = e.target.files[0]; if(!f) return
      const path = `${Date.now()}_${f.name}`
      const promise = supabase.storage.from(bucket).upload(path, f)
      toast.promise(promise, { loading: 'Nahrávám...', success: 'Nahráno', error: 'Chyba' })
        .then(async () => {
            const { data } = supabase.storage.from(bucket).getPublicUrl(path); cb(data.publicUrl)
        })
  }

  const dateFmt = (d) => d ? new Date(d).toLocaleDateString('cs-CZ') : '??'
  const klubName = (n) => n ? n.replace(/,\s*z\.s\./i, '').replace(/spolek/i, '').trim() : 'Bez klubu'

  if (!osoba) return <div className="p-10 text-center text-slate-500 animate-pulse">Načítám...</div>

  return (
    <div className="min-h-screen bg-slate-950 pb-32">
        
        {/* HEADER */}
        <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 shadow-2xl">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 overflow-hidden">
                    <Link to="/" className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-6 h-6" /></Link>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="shrink-0 w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden hidden sm:block">
                            {osoba.foto_url ? <img src={osoba.foto_url} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-500 font-bold">{osoba.jmeno[0]}{osoba.prijmeni[0]}</div>}
                        </div>
                        <div className="flex flex-col truncate">
                            <h1 className="text-lg md:text-xl font-bold text-white truncate leading-tight">{osoba.jmeno} {osoba.prijmeni}</h1>
                            <span className="text-xs md:text-sm text-blue-400 flex items-center gap-1 truncate"><Shield className="w-3 h-3" /> {klubName(osoba.kluby?.nazev)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => setModalProfil(true)} className="p-2 md:px-4 md:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer"><Edit2 className="w-4 h-4" /> <span className="hidden md:inline text-sm font-medium">Upravit</span></button>
                    <button type="button" onClick={() => {setFormLicence({typ_role: 'Trenér', uroven: 'C', aktivni: true}); setModalLicence(true)}} className="p-2 md:px-4 md:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"><Plus className="w-5 h-5" /> <span className="hidden md:inline text-sm font-bold">Licence</span></button>
                </div>
            </div>
        </div>

        {/* OBSAH */}
        <div className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
            
            {/* Vizitka */}
            <div className="lg:col-span-4 lg:sticky lg:top-24">
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center shadow-lg relative overflow-hidden">
                    <div className="relative z-10 mb-4 mt-2">
                        {osoba.foto_url ? <img src={osoba.foto_url} className="w-32 h-32 rounded-full object-cover border-4 border-slate-800 shadow-2xl" /> : <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-4xl font-bold text-slate-600 shadow-2xl">{osoba.jmeno[0]}{osoba.prijmeni[0]}</div>}
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center mb-6">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">ČLEN</span>
                        {osoba.je_trener && <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-900/30 text-blue-400 border border-blue-500/30">TRENÉR</span>}
                        {osoba.je_rozhodci && <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-900/30 text-red-400 border border-red-500/30">ROZHODČÍ</span>}
                    </div>
                    <div className="w-full space-y-3">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3 text-slate-300"><Mail className="w-4 h-4 text-slate-500"/> <span className="text-sm truncate">{osoba.email}</span></div>
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3 text-slate-300"><Phone className="w-4 h-4 text-slate-500"/> <span className="text-sm">{osoba.telefon || '---'}</span></div>
                    </div>
                </div>
            </div>

            {/* Licence */}
            <div className="lg:col-span-8">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FileText className="text-blue-400 w-5 h-5"/> Aktivní licence</h2>
                <div className="grid grid-cols-1 gap-4">
                    {osoba.licence && osoba.licence.map(lic => {
                        const jePlatna = lic.platnost_do && new Date(lic.platnost_do) > new Date()
                        const barva = lic.typ_role === 'Trenér' ? 'blue' : 'red'
                        return (
                            <div key={lic.id} className="relative group bg-slate-900/40 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all hover:shadow-xl overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${barva}-500`}></div>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`text-xs font-bold uppercase tracking-wider text-${barva}-400`}>{lic.typ_role}</span>
                                            {jePlatna ? <span className="flex items-center gap-1 text-[10px] font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20"><CheckCircle className="w-3 h-3"/> AKTIVNÍ</span> : <span className="flex items-center gap-1 text-[10px] font-bold bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20"><AlertTriangle className="w-3 h-3"/> NEAKTIVNÍ</span>}
                                        </div>
                                        <div className="text-2xl font-bold text-white flex items-baseline gap-2">{lic.uroven}</div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-400">
                                            <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> Získáno: {dateFmt(lic.datum_ziskani)}</div>
                                            <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Platí do: <span className={jePlatna?'text-white':'text-red-400'}>{dateFmt(lic.platnost_do)}</span></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 w-full md:w-auto pt-4 md:pt-0 border-t border-white/5 md:border-0">
                                        <button type="button" onClick={() => logikaProdlouzeni(lic)} className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-green-600/20 hover:text-green-300 text-slate-300 rounded-lg border border-white/5 transition-all group/btn cursor-pointer">
                                            <RefreshCw className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500"/>
                                            <span className="text-sm font-medium">Obnovit</span>
                                        </button>
                                        <div className="h-6 w-px bg-white/10 mx-1 hidden md:block"></div>
                                        {lic.certifikat_url && (<a href={lic.certifikat_url} target="_blank" className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"><Download className="w-4 h-4"/></a>)}
                                        <button type="button" onClick={() => {setFormLicence(lic); setModalLicence(true)}} className="p-2 bg-white/5 hover:bg-blue-600/20 hover:text-blue-300 text-slate-400 rounded-lg transition-colors cursor-pointer"><Edit2 className="w-4 h-4"/></button>
                                        <button type="button" onClick={() => logikaMazani(lic.id)} className="p-2 bg-white/5 hover:bg-red-600/20 hover:text-red-300 text-slate-400 rounded-lg transition-colors cursor-pointer"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {(!osoba.licence || osoba.licence.length === 0) && <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">Žádná licence</div>}
                </div>
            </div>
        </div>

        {/* --- MODÁLY (Editace) --- */}
        
        {modalProfil && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl relative my-auto">
                    <button type="button" onClick={()=>setModalProfil(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer"><X/></button>
                    <h3 className="text-xl font-bold text-white mb-6">Upravit profil</h3>
                    <div className="space-y-4">
                        <div className="flex justify-center mb-6">
                             <label className="cursor-pointer relative group">
                                <img src={formOsoba.foto_url || 'https://via.placeholder.com/150'} className="w-24 h-24 rounded-full object-cover border-2 border-slate-600"/>
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white"/></div>
                                <input type="file" className="hidden" onChange={e => upload(e, 'avatary', url => setFormOsoba({...formOsoba, foto_url: url}))}/>
                             </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-xs text-slate-400 uppercase font-bold">Email</label><input type="text" value={formOsoba.email||''} onChange={e=>setFormOsoba({...formOsoba, email:e.target.value})} className="w-full bg-slate-800 rounded-xl p-3 text-white border border-transparent focus:border-blue-500 outline-none mt-1"/></div>
                            <div><label className="text-xs text-slate-400 uppercase font-bold">Telefon</label><input type="text" value={formOsoba.telefon||''} onChange={e=>setFormOsoba({...formOsoba, telefon:e.target.value})} className="w-full bg-slate-800 rounded-xl p-3 text-white border border-transparent focus:border-blue-500 outline-none mt-1"/></div>
                        </div>
                        <div className="flex gap-2 pt-2">
                             <button type="button" onClick={()=>setFormOsoba({...formOsoba, je_trener:!formOsoba.je_trener})} className={`flex-1 p-3 rounded-xl border font-bold text-sm cursor-pointer ${formOsoba.je_trener?'bg-blue-600 border-blue-500 text-white':'bg-slate-800 border-slate-700 text-slate-500'}`}>Trenér</button>
                             <button type="button" onClick={()=>setFormOsoba({...formOsoba, je_rozhodci:!formOsoba.je_rozhodci})} className={`flex-1 p-3 rounded-xl border font-bold text-sm cursor-pointer ${formOsoba.je_rozhodci?'bg-red-600 border-red-500 text-white':'bg-slate-800 border-slate-700 text-slate-500'}`}>Rozhodčí</button>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-8">
                        <button type="button" onClick={ulozitProfil} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold cursor-pointer">{loading?'...':'Uložit'}</button>
                    </div>
                </div>
            </div>
        )}

        {modalLicence && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl relative my-auto">
                    <button type="button" onClick={()=>setModalLicence(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer"><X/></button>
                    <h3 className="text-xl font-bold text-white mb-6">{formLicence.id ? 'Upravit' : 'Nová'} licence</h3>
                    <div className="space-y-4">
                        <div className="flex bg-slate-800 p-1 rounded-xl mb-4">
                            {['Trenér', 'Rozhodčí'].map(r => (
                                <button type="button" key={r} onClick={()=>setFormLicence({...formLicence, typ_role:r, uroven: r==='Trenér'?'C':'Národní'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${formLicence.typ_role===r ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}>{r}</button>
                            ))}
                        </div>
                        <div>
                             <label className="text-xs text-slate-400 uppercase font-bold">Úroveň</label>
                             <div className="flex flex-wrap gap-2 mt-1">
                                {['A', 'B', 'C', 'D'].map(opt => (
                                    <button type="button" key={opt} onClick={() => setFormLicence({...formLicence, uroven: opt})} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${formLicence.uroven === opt ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>{opt}</button>
                                ))}
                             </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div><label className="text-xs text-slate-400 uppercase font-bold">Získáno</label><input type="date" value={formLicence.datum_ziskani||''} onChange={zmenaDataZiskani} className="w-full bg-slate-800 rounded-xl p-3 text-white mt-1 [color-scheme:dark]"/></div>
                             <div><label className="text-xs text-slate-400 uppercase font-bold">Platí do</label><input type="date" value={formLicence.platnost_do||''} onChange={e=>setFormLicence({...formLicence, platnost_do:e.target.value})} className="w-full bg-slate-800 rounded-xl p-3 text-white mt-1 [color-scheme:dark]"/></div>
                        </div>
                        {formLicence.typ_role === 'Trenér' && (<div className="text-xs text-blue-400 bg-blue-500/10 p-3 rounded-lg flex gap-2"><RefreshCw className="w-3 h-3 mt-0.5"/> Datum platnosti se u trenéra počítá automaticky.</div>)}
                        <div>
                            <label className="flex items-center justify-center gap-2 w-full bg-slate-800 border border-dashed border-slate-600 hover:border-blue-500 rounded-xl p-4 text-slate-400 cursor-pointer mt-2">
                                <Upload className="w-4 h-4"/> <span>{formLicence.certifikat_url ? 'Soubor nahrán (změnit)' : 'Nahrát certifikát'}</span>
                                <input type="file" className="hidden" onChange={e => upload(e, 'dokumenty', url => setFormLicence({...formLicence, certifikat_url: url}))}/>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-8">
                        <button type="button" onClick={ulozitLicenci} className="flex-1 py-3 bg-green-600 hover:bg-green-500 rounded-xl text-white font-bold cursor-pointer">{loading?'...':'Uložit'}</button>
                    </div>
                </div>
            </div>
        )}

        {/* --- NOVÉ: VLASTNÍ POTVRZOVACÍ MODÁL (z-100 = nejvyšší vrstva) --- */}
        {potvrzovac && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
                <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center transform transition-all scale-100">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${potvrzovac.type === 'danger' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                        {potvrzovac.type === 'danger' ? <Trash2 className="w-8 h-8"/> : <HelpCircle className="w-8 h-8"/>}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">{potvrzovac.title}</h3>
                    <p className="text-slate-400 mb-8">{potvrzovac.desc}</p>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={potvrzovac.action} 
                            className={`flex-1 py-3 rounded-xl text-white font-bold transition-transform active:scale-95 ${potvrzovac.type === 'danger' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                        >
                            Ano, provést
                        </button>
                        <button 
                            onClick={() => setPotvrzovac(null)} 
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-transform active:scale-95"
                        >
                            Zrušit
                        </button>
                    </div>
                </div>
            </div>
        )}

    </div>
  )
}

export default DetailOsoby