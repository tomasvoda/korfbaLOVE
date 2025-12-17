import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { 
  ArrowLeft, Mail, Phone, Shield, Camera, Edit2, FileText, Calendar, 
  Download, CheckCircle, AlertTriangle, Upload, RefreshCw, Plus, Trash2, 
  Clock, X, HelpCircle, Briefcase, Users, GraduationCap, MapPin, ArrowRight, 
  Check, CalendarOff, Minus, Save, ExternalLink, ChevronDown, Info 
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getAktualniSezona, getSezonyList, generovatTerminy, getLimitySezony } from '../utils/dateUtils'

// --- UI KOMPONENTY ---
const SectionLabel = ({ icon: Icon, children }) => (
    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 mt-6">
        <Icon className="w-3 h-3 text-blue-400" />{children}
    </div>
)

const Stepper = ({ label, value, onChange, min = 1 }) => (
    <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-300">{label}</span>
        <div className="flex items-center gap-3">
            <button onClick={() => onChange(Math.max(min, value - 1))} className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white transition-all active:scale-90"><Minus className="w-5 h-5"/></button>
            <span className="font-mono font-bold text-lg w-8 text-center text-blue-200">{value}</span>
            <button onClick={() => onChange(value + 1)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all active:scale-90"><Plus className="w-5 h-5"/></button>
        </div>
    </div>
)

const ToggleGrid = ({ options, value, onChange, color = 'blue' }) => (
    <div className="grid grid-cols-4 gap-2">
        {options.map(opt => {
            const isSelected = String(value) === String(opt.value)
            const activeClass = color === 'purple' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-blue-600 border-blue-500 text-white'
            return (<button key={opt.value} onClick={() => onChange(opt.value)} className={`py-3 px-1 rounded-xl text-xs font-bold transition-all border shadow-lg flex items-center justify-center ${isSelected ? `${activeClass} scale-[1.02]` : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/20 hover:text-white'}`}>{opt.label}</button>)
        })}
    </div>
)

// --- POMOCNÉ FUNKCE ---
const parseSezonaStart = (sezona) => {
    if (!sezona) return null
    const [start] = sezona.split('/').map(Number)
    return Number.isFinite(start) ? start : null
}

const sezonaForDate = (dateValue) => {
    if (!dateValue) return null
    const d = new Date(dateValue)
    if (Number.isNaN(d.getTime())) return null
    const month = d.getMonth()
    const year = d.getFullYear()
    const start = month >= 6 ? year : year - 1
    return `${start}/${start + 1}`
}

const getRelevantSezonyProLicenci = (platnostDo, count = 2) => {
    const targetSezona = sezonaForDate(platnostDo)
    if (!targetSezona) return []
    const start = parseSezonaStart(targetSezona)
    if (start === null) return []
    const seznam = []
    for (let i = 0; i < count; i++) {
        const base = start - i
        seznam.push(`${base}/${base + 1}`)
    }
    return seznam
}

const spocitatKredityAktivity = (aktivita) => {
    if (!aktivita) return 0
    if (typeof aktivita.celkem_kreditu === 'number') return aktivita.celkem_kreditu
    const den = Array.isArray(aktivita.den_v_tydnu) ? aktivita.den_v_tydnu[0] : aktivita.den_v_tydnu
    const terminy = generovatTerminy(
        aktivita.datum_od,
        aktivita.datum_do,
        den,
        aktivita.vynechane_datumy || []
    )
    const aktivni = terminy.filter(t => t.aktivni).length
    return aktivni * (aktivita.pocet_jednotek || 1)
}

const spocitatKredityProLicenci = (licence, cinnosti) => {
    if (!licence || licence.typ_role !== 'Trenér') return 0
    const relevant = getRelevantSezonyProLicenci(licence.platnost_do)
    if (!relevant.length) return 0
    return cinnosti
        .filter(akt => akt.role === 'Trenér' && relevant.includes(akt.sezona))
        .reduce((sum, akt) => sum + spocitatKredityAktivity(akt), 0)
}

const KONCEPCE_CUTOFF = new Date('2022-12-27')
const MIN_KONCEPCE_YEAR = 2022
const spocitatPlatnostTrenerskeLicence = (datumZiskani) => {
    if (!datumZiskani) return ''
    const parsed = new Date(datumZiskani)
    if (Number.isNaN(parsed.getTime())) return ''
    const baseYear = parsed < KONCEPCE_CUTOFF ? MIN_KONCEPCE_YEAR : parsed.getFullYear()
    const expiryYear = baseYear + 3
    return `${expiryYear}-06-30`
}

// --- HLAVNÍ STRÁNKA ---
function DetailOsoby() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [osoba, setOsoba] = useState(null)
  const [mojeCinnosti, setMojeCinnosti] = useState([]) 
  const [klubyList, setKlubyList] = useState([])
  
  // Modály
  const [modalProfil, setModalProfil] = useState(false)
  const [modalLicence, setModalLicence] = useState(false)
  const [modalCinnost, setModalCinnost] = useState(false)
  const [potvrzovac, setPotvrzovac] = useState(null)
  
  // Formuláře
  const [formOsoba, setFormOsoba] = useState({})
  const [formLicence, setFormLicence] = useState({ typ_role: 'Trenér', uroven: 'C', aktivni: true, datum_ziskani: '', platnost_do: '' })
  
  // FORMULÁŘ ČINNOSTI
  const [formCinnost, setFormCinnost] = useState({
      id: null, nazev: '', sezona: '', role: 'Trenér', kategorie: 'U11', 
      den_v_tydnu: '1', pocet_jednotek: 1, pocet_sverencu: 10, lokace: '', 
      cas_od: '17:00', cas_do: '18:00', 
      datum_od: '', datum_do: '', vynechane_datumy: []
  })
  
  const [terminyPreview, setTerminyPreview] = useState([])
  const [ziskaneKredity, setZiskaneKredity] = useState(0)
  const [loading, setLoading] = useState(false)

  // Filtr sezóny v přehledu
  const [filtrSezona, setFiltrSezona] = useState(getAktualniSezona().nazev)

  useEffect(() => { nacist() }, [id])

  // --- REAKTIVNÍ VÝPOČET KREDITŮ A KALENDÁŘE ---
  useEffect(() => {
      // Pouze pokud je modál otevřený a máme data
      if (modalCinnost && formCinnost.datum_od && formCinnost.datum_do) {
          try {
            const preview = generovatTerminy(
                formCinnost.datum_od, 
                formCinnost.datum_do, 
                formCinnost.den_v_tydnu, 
                formCinnost.vynechane_datumy || []
            )
            setTerminyPreview(preview)
            
            // Okamžitý přepočet kreditů v modalu
            const aktivniPocet = preview.filter(t => t.aktivni).length
            setZiskaneKredity(aktivniPocet * (formCinnost.pocet_jednotek || 1))
          } catch (e) {
              console.error("Chyba při generování:", e)
          }
      }
  }, [formCinnost, modalCinnost]) 
  // Sledujeme celý objekt formCinnost, aby se to pře-renderovalo při každé změně (kliknutí na den, změna času atd.)

  const nacist = async () => {
    const { data: dataOsoba } = await supabase.from('osoby').select('*, kluby(id, nazev), licence(*)').eq('id', id).single()
    const { data: dataKluby } = await supabase.from('kluby').select('id, nazev').order('nazev')
    const { data: dataCinnosti } = await supabase.from('cinnosti').select('*').eq('osoba_id', id).order('created_at', { ascending: false })

    if(dataOsoba) { setOsoba(dataOsoba); setFormOsoba({ ...dataOsoba, klub_id: dataOsoba.klub_id }) }
    if(dataKluby) setKlubyList(dataKluby)
    if(dataCinnosti) setMojeCinnosti(dataCinnosti)
  }

  // --- LOGIKA ČINNOSTÍ ---
  
  const zmenitSezonu = (novaSezona) => {
      const limity = getLimitySezony(novaSezona)
      setFormCinnost(prev => ({
          ...prev,
          sezona: novaSezona,
          datum_od: limity.start,
          datum_do: limity.end
      }))
  }

  const toggleTermin = (termin) => {
      const datum = termin.datum
      let noveVynechane = [...(formCinnost.vynechane_datumy || [])]
      
      if (noveVynechane.includes(datum)) {
          noveVynechane = noveVynechane.filter(d => d !== datum)
      } else {
          noveVynechane.push(datum)
      }
      setFormCinnost({ ...formCinnost, vynechane_datumy: noveVynechane })
  }

  const otevritNovouCinnost = () => {
      const currentSezona = getAktualniSezona()
      setFormCinnost({
          id: null, nazev: '', sezona: currentSezona.nazev, 
          role: 'Trenér', kategorie: 'U11', 
          den_v_tydnu: '1', pocet_jednotek: 1, pocet_sverencu: 10, 
          lokace: '', cas_od: '17:00', cas_do: '18:00', 
          datum_od: currentSezona.start, datum_do: currentSezona.end, 
          vynechane_datumy: []
      })
      setModalCinnost(true)
  }

  const otevritEditaciCinnosti = (akt) => {
      // Bezpečnostní ošetření dat z DB
      setFormCinnost({
          ...akt,
          // Ujistíme se, že den_v_tydnu je string (pro ToggleGrid)
          den_v_tydnu: String(Array.isArray(akt.den_v_tydnu) ? akt.den_v_tydnu[0] : akt.den_v_tydnu),
          vynechane_datumy: akt.vynechane_datumy || []
      })
      setModalCinnost(true)
  }

  const ulozitCinnost = async () => {
      if (!formCinnost.lokace) return toast.error('Vyplňte místo konání')
      
      // 1. Spočítáme finální kredity ještě před uložením
      const finalPreview = generovatTerminy(
          formCinnost.datum_od, formCinnost.datum_do, formCinnost.den_v_tydnu, formCinnost.vynechane_datumy
      )
      const finalKredity = finalPreview.filter(t => t.aktivni).length * (formCinnost.pocet_jednotek || 1)

      const dnyNazvy = ['?', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
      const autoNazev = `${formCinnost.kategorie} - ${dnyNazvy[parseInt(formCinnost.den_v_tydnu)]}`

      const payload = {
          osoba_id: id, nazev: autoNazev, kategorie: formCinnost.kategorie, lokace: formCinnost.lokace,
          den_v_tydnu: formCinnost.den_v_tydnu, // Ukládáme jako jednoduchou hodnotu
          cas_od: formCinnost.cas_od, cas_do: formCinnost.cas_do,
          datum_od: formCinnost.datum_od, datum_do: formCinnost.datum_do, sezona: formCinnost.sezona,
          role: formCinnost.role, pocet_jednotek: 1, pocet_sverencu: formCinnost.pocet_sverencu,
          vynechane_datumy: formCinnost.vynechane_datumy,
          celkem_kreditu: finalKredity // TADY UKLÁDÁME VÝSLEDEK DO DB
      }

      try {
          if (formCinnost.id) { 
              await supabase.from('cinnosti').update(payload).eq('id', formCinnost.id)
              toast.success('Aktualizováno') 
          } else { 
              await supabase.from('cinnosti').insert([payload])
              toast.success('Vytvořeno') 
          }
          setModalCinnost(false)
          nacist()
      } catch (err) { toast.error('Chyba: ' + err.message) }
  }

  const smazatCinnost = (aktId) => {
      otevritPotvrzeni('Smazat činnost?', 'Opravdu smazat?', async () => {
          await supabase.from('cinnosti').delete().eq('id', aktId); toast.success('Smazáno'); nacist(); setPotvrzovac(null)
      }, 'danger')
  }

  // Helper pro požadavky na kredity
  const getLicenseRequirement = (uroven) => {
      if(uroven === 'D') return 50
      if(uroven === 'C') return 100
      if(uroven === 'B') return 150
      return 0
  }

  // Filtrování seznamu
  const filtrovaneCinnosti = filtrSezona 
      ? mojeCinnosti.filter(a => a.sezona === filtrSezona)
      : mojeCinnosti

  // --- OSTATNÍ LOGIKA ---
  const otevritPotvrzeni = (title, desc, action, type = 'info') => { setPotvrzovac({ title, desc, action, type }) }
  const smazatCelouOsobu = () => { otevritPotvrzeni('Smazat osobu?', 'Opravdu?', async () => { await supabase.from('licence').delete().eq('osoba_id', id); await supabase.from('cinnosti').delete().eq('osoba_id', id); await supabase.from('osoby').delete().eq('id', id); toast.success('Smazáno'); navigate('/') }, 'danger') }
  const logikaProdlouzeni = async (licence) => { const rok = new Date().getFullYear(); const novy = rok + 1; otevritPotvrzeni('Prodloužit?', `Do 30.6.${novy}?`, async () => { await supabase.from('licence').update({ platnost_do: `${novy}-06-30` }).eq('id', licence.id); nacist(); setPotvrzovac(null) }, 'info') }
  const logikaMazaniLicence = (lid) => { otevritPotvrzeni('Smazat?', 'Nevratné.', async () => { await supabase.from('licence').delete().eq('id', lid); nacist(); setPotvrzovac(null) }, 'danger') }
  const ulozitProfil = async () => { try { await supabase.from('osoby').update({ email: formOsoba.email, telefon: formOsoba.telefon, foto_url: formOsoba.foto_url, klub_id: formOsoba.klub_id||null, je_trener: formOsoba.je_trener, je_rozhodci: formOsoba.je_rozhodci }).eq('id', id); await nacist(); setModalProfil(false); toast.success('Uloženo') } catch(e){toast.error('Chyba')} }
  const ulozitLicenci = async () => { 
      const platnostAuto = formLicence.typ_role === 'Trenér' 
          ? spocitatPlatnostTrenerskeLicence(formLicence.datum_ziskani) 
          : formLicence.platnost_do
      const p = { 
          osoba_id: id, 
          typ_role: formLicence.typ_role, 
          uroven: formLicence.uroven, 
          datum_ziskani: formLicence.datum_ziskani, 
          platnost_do: platnostAuto || formLicence.platnost_do || null, 
          certifikat_url: formLicence.certifikat_url, 
          aktivni: true 
      }
      try { 
          if(formLicence.id) await supabase.from('licence').update(p).eq('id', formLicence.id); 
          else await supabase.from('licence').insert([p]); 
          await nacist(); 
          setModalLicence(false); 
          toast.success('Uloženo') 
      } catch(e){toast.error('Chyba')} 
  }
  const upload = async (e, bucket, cb) => { const f = e.target.files[0]; if(!f) return; const path = `${Date.now()}_${f.name}`; toast.promise(supabase.storage.from(bucket).upload(path, f),{loading:'Nahrávám...',success:'Nahráno',error:'Chyba'}).then(async()=>{const{data}=supabase.storage.from(bucket).getPublicUrl(path);cb(data.publicUrl)}) }
  
  const formatDate = (iso) => new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' })
  const dateFmt = (d) => d ? new Date(d).toLocaleDateString('cs-CZ') : '??'
  
  const dnyOptions = [{value:'1',label:'Po'},{value:'2',label:'Út'},{value:'3',label:'St'},{value:'4',label:'Čt'},{value:'5',label:'Pá'},{value:'6',label:'So'},{value:'7',label:'Ne'}]
  const katOptions = [{value:'U9',label:'U9'},{value:'U11',label:'U11'},{value:'U13',label:'U13'},{value:'U16',label:'U16'},{value:'U19',label:'U19'},{value:'SEN',label:'SEN'}]
  const sezonyOsoby = useMemo(() => {
      const unique = Array.from(new Set(mojeCinnosti.map(c => c.sezona).filter(Boolean)))
      return unique.sort((a, b) => b.localeCompare(a))
  }, [mojeCinnosti])
  useEffect(() => {
      if (sezonyOsoby.length && !sezonyOsoby.includes(filtrSezona)) {
          setFiltrSezona(sezonyOsoby[0])
      }
      if (!sezonyOsoby.length && filtrSezona) {
          setFiltrSezona('')
      }
  }, [sezonyOsoby, filtrSezona])
  useEffect(() => {
      if (formLicence.typ_role !== 'Trenér') return
      const vypocitanaPlatnost = spocitatPlatnostTrenerskeLicence(formLicence.datum_ziskani)
      if (vypocitanaPlatnost && formLicence.platnost_do !== vypocitanaPlatnost) {
          setFormLicence(prev => ({ ...prev, platnost_do: vypocitanaPlatnost }))
      }
  }, [formLicence.typ_role, formLicence.datum_ziskani, formLicence.platnost_do])
  const activeColor = formCinnost.role === 'Trenér' ? 'blue' : 'purple'

  if (!osoba) return <div className="p-10 text-center text-slate-500 animate-pulse">Načítám...</div>

  return (
    <div className="min-h-screen bg-transparent pb-32">
        {/* HEADER */}
        <div className="sticky top-0 z-40 glass-panel border-t-0 border-x-0 rounded-b-3xl">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4"><Link to="/" className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"><ArrowLeft className="w-6 h-6" /></Link><div className="flex items-center gap-3 overflow-hidden"><div className="shrink-0 w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden hidden sm:block">{osoba.foto_url ? <img src={osoba.foto_url} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-500 font-bold">{osoba.jmeno[0]}{osoba.prijmeni[0]}</div>}</div><div className="flex flex-col truncate"><h1 className="text-lg md:text-xl font-bold text-white truncate leading-tight">{osoba.jmeno} {osoba.prijmeni}</h1><span className="text-xs md:text-sm text-blue-400 flex items-center gap-1 truncate"><Shield className="w-3 h-3" /> {osoba.kluby?.nazev || 'Bez klubu'}</span></div></div></div>
                <div className="flex items-center gap-2 shrink-0"><button onClick={() => setModalProfil(true)} className="btn-secondary p-2 md:px-4 md:py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Edit2 className="w-4 h-4" /> <span className="hidden md:inline">Upravit</span></button><button onClick={smazatCelouOsobu} className="btn-danger p-2 md:px-4 md:py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Trash2 className="w-4 h-4" /></button></div>
            </div>
        </div>

        <div className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
            {/* VIZITKA */}
            <div className="lg:col-span-4 lg:sticky lg:top-24">
                <div className="glass-panel rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden mb-6">
                    <div className="relative z-10 mb-4 mt-2">{osoba.foto_url ? <img src={osoba.foto_url} className="w-32 h-32 rounded-full object-cover border-4 border-slate-800 shadow-2xl" /> : <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-900 flex items-center justify-center text-4xl font-bold text-slate-600 shadow-2xl">{osoba.jmeno[0]}{osoba.prijmeni[0]}</div>}</div>
                    <div className="flex flex-wrap gap-2 justify-center mb-6"><span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">ČLEN</span>{osoba.je_trener && <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-900/30 text-blue-400 border border-blue-500/30">TRENÉR</span>}{osoba.je_rozhodci && <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-900/30 text-red-400 border border-red-500/30">ROZHODČÍ</span>}</div>
                    <div className="w-full space-y-3"><div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3 text-slate-300"><Mail className="w-4 h-4 text-slate-500"/> <span className="text-sm truncate">{osoba.email}</span></div><div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3 text-slate-300"><Phone className="w-4 h-4 text-slate-500"/> <span className="text-sm">{osoba.telefon || '---'}</span></div></div>
                </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
                {/* LICENCE */}
                <div>
                    <div className="flex justify-between items-center mb-4 px-2"><h2 className="text-xl font-bold text-white flex items-center gap-2"><FileText className="text-blue-400 w-5 h-5"/> Licence</h2><button onClick={() => {setFormLicence({id: null, typ_role: 'Trenér', uroven: 'C', aktivni: true, datum_ziskani: '', platnost_do: '', certifikat_url: ''}); setModalLicence(true)}} className="btn-secondary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Plus className="w-3 h-3"/> Přidat</button></div>
                    <div className="grid grid-cols-1 gap-4">
                        {osoba.licence && osoba.licence.map(lic => {
                            const jePlatna = lic.platnost_do && new Date(lic.platnost_do) > new Date()
                            const barva = lic.typ_role === 'Trenér' ? 'blue' : 'red'
                            const req = lic.typ_role === 'Trenér' ? getLicenseRequirement(lic.uroven) : 0
                            const rokKonceLicence = lic.platnost_do ? new Date(lic.platnost_do).getFullYear() : null
                            const credits = lic.typ_role === 'Trenér' ? spocitatKredityProLicenci(lic, mojeCinnosti) : 0
                            
                            return (
                            <div key={lic.id} className="relative group glass-panel rounded-2xl p-5 overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${barva}-500`}></div>
                                <div className="flex justify-between items-center relative z-10">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1"><span className={`text-xs font-bold uppercase tracking-wider text-${barva}-400`}>{lic.typ_role}</span>{jePlatna ? <span className="flex items-center gap-1 text-[10px] font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20"><CheckCircle className="w-3 h-3"/> AKTIVNÍ</span> : <span className="flex items-center gap-1 text-[10px] font-bold bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20"><AlertTriangle className="w-3 h-3"/> NEAKTIVNÍ</span>}</div>
                                        <div className="text-2xl font-bold text-white flex items-baseline gap-2">{lic.uroven}</div>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-400"><div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5"/> {dateFmt(lic.datum_ziskani)}</div><div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> do: <span className={jePlatna?'text-white':'text-red-400'}>{dateFmt(lic.platnost_do)}</span></div></div>
                                        {req > 0 && (
                                            <div className={`mt-3 flex items-center gap-3 text-xs p-2 rounded-lg border ${credits >= req ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                                                <Info className="w-4 h-4"/>
                                                <span>Předpoklad k {rokKonceLicence ? `30.6.${rokKonceLicence}` : 'termínu'}: <strong className="text-white">{credits}</strong> / {req} kreditů</span>
                                                {credits >= req && <Check className="w-4 h-4"/>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2"><button onClick={() => logikaProdlouzeni(lic)} className="btn-secondary px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1"><RefreshCw className="w-3 h-3"/> Obnovit</button>{lic.certifikat_url && (<a href={lic.certifikat_url} target="_blank" className="btn-secondary p-2 rounded-lg"><Download className="w-4 h-4"/></a>)}<button onClick={() => logikaMazaniLicence(lic.id)} className="btn-danger p-2 rounded-lg"><Trash2 className="w-4 h-4"/></button></div>
                                </div>
                            </div>
                            )
                        })}
                        {(!osoba.licence || osoba.licence.length === 0) && <div className="glass-panel text-center py-8 text-slate-500 rounded-2xl border-dashed">Žádná licence</div>}
                    </div>
                </div>

                {/* ČINNOST - HORIZONTÁLNÍ FILTR */}
                <div>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 px-2 gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start overflow-hidden">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 shrink-0"><Briefcase className="text-purple-400 w-5 h-5"/> Činnost</h2>
                            <div className="flex gap-2 overflow-x-auto pb-1 pl-1 mask-fade hide-scrollbar w-full md:w-auto">
                                {(sezonyOsoby.length ? sezonyOsoby : [filtrSezona]).map(s => (
                                    <button key={s} onClick={() => setFiltrSezona(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${filtrSezona === s ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:text-white'}`}>{s}</button>
                                ))}
                            </div>
                        </div>
                        <button onClick={otevritNovouCinnost} className="btn-primary w-full md:w-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-lg shrink-0"><Plus className="w-3.5 h-3.5"/> Nová činnost</button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filtrovaneCinnosti.map(akt => {
                            const kredityZobrazeni = spocitatKredityAktivity(akt)
                            return (
                            <div key={akt.id} className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-blue-500/30 transition-all relative overflow-hidden group">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${akt.role === 'Trenér' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                                <div>
                                    <div className="flex justify-between items-start mb-3 pl-2">
                                        <span className="text-lg font-black text-white">{akt.kategorie}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${akt.role==='Trenér' ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' : 'bg-purple-500/10 border-purple-500/20 text-purple-300'}`}>{akt.role}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-4 pl-2">
                                        <div className="w-14 h-14 rounded-lg bg-slate-800 border border-white/10 flex flex-col items-center justify-center shrink-0">
                                            <span className="text-[9px] text-slate-500 font-bold uppercase">Kredity</span>
                                            <span className="text-xl font-bold text-blue-300">{kredityZobrazeni}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs text-white font-bold flex items-center gap-1"><Clock className="w-3 h-3 text-blue-400"/> {akt.cas_od.slice(0,5)} - {akt.cas_do.slice(0,5)}</div>
                                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(akt.lokace)}`} target="_blank" rel="noreferrer" className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 truncate max-w-[150px] hover:text-white underline decoration-dashed">
                                                <MapPin className="w-3 h-3"/> {akt.lokace} <ExternalLink className="w-2 h-2 opacity-50"/>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-3 border-t border-white/5 pl-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-500 font-bold">{akt.sezona}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => otevritEditaciCinnosti(akt)} className="text-slate-500 hover:text-blue-400 transition-colors bg-white/5 p-1.5 rounded-lg"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={() => smazatCinnost(akt.id)} className="text-slate-500 hover:text-red-400 transition-colors bg-white/5 p-1.5 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            </div>
                        )})}
                        {filtrovaneCinnosti.length === 0 && <div className="col-span-full glass-panel text-center py-10 text-slate-500 rounded-2xl border-dashed">V této sezóně žádné činnosti.</div>}
                    </div>
                </div>
            </div>
        </div>

        {/* MODAL WIZARD */}
        {modalCinnost && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
                <div className="glass-panel w-[98%] sm:w-full max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col rounded-3xl overflow-hidden relative shadow-2xl border border-white/10">
                    <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-slate-900/80 backdrop-blur-md shrink-0">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg ${activeColor === 'blue' ? 'bg-blue-600 shadow-blue-500/20' : 'bg-purple-600 shadow-purple-500/20'}`}><Calendar className="w-5 h-5"/></div>
                            <div>
                                <h2 className="text-xl font-bold text-white leading-tight">{formCinnost.id ? 'Upravit' : 'Nová'} činnost</h2>
                                <p className="text-xs text-slate-400 font-medium hidden sm:block">Pro: {osoba.jmeno} {osoba.prijmeni}</p>
                            </div>
                        </div>
                        <button onClick={() => setModalCinnost(false)} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"><X/></button>
                    </div>
                    
                    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                        {/* 1. NASTAVENÍ */}
                        <div className="w-full lg:w-[450px] p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-white/10 bg-slate-950/50">
                            
                            {/* SEZÓNA */}
                            <div className="mb-4">
                                <label className="text-xs text-slate-400 font-bold ml-1 uppercase">Soutěžní ročník</label>
                                <div className="relative mt-1">
                                    <select 
                                        className="w-full glass-input p-3 appearance-none font-bold text-white bg-slate-900/50 cursor-pointer hover:bg-white/5 transition-colors" 
                                        value={formCinnost.sezona} 
                                        onChange={e => zmenitSezonu(e.target.value)}
                                    >
                                        {getSezonyList().map(s => <option key={s} value={s} className="bg-slate-900 text-slate-300">{s}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-slate-500 pointer-events-none"/>
                                </div>
                            </div>

                            <div className="bg-slate-900/80 p-1.5 rounded-2xl flex mb-6 border border-white/5">
                                <button onClick={() => setFormCinnost({...formCinnost, role: 'Trenér'})} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${formCinnost.role==='Trenér' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}>Trenér</button>
                                <button onClick={() => setFormCinnost({...formCinnost, role: 'Asistent'})} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${formCinnost.role==='Asistent' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'}`}>Asistent</button>
                            </div>
                            
                            <SectionLabel icon={Briefcase}>Kategorie</SectionLabel>
                            <ToggleGrid options={katOptions} value={formCinnost.kategorie} onChange={val => setFormCinnost({...formCinnost, kategorie: val})} color={activeColor} />
                            
                            <SectionLabel icon={Calendar}>Kdy (Den v týdnu)</SectionLabel>
                            <ToggleGrid options={dnyOptions} value={formCinnost.den_v_tydnu} onChange={val => setFormCinnost({...formCinnost, den_v_tydnu: val})} color={activeColor} />
                            
                            <SectionLabel icon={Clock}>Čas a Místo</SectionLabel>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                     <div className="relative"><input type="time" className="w-full glass-input pl-10 pr-3 py-3 font-bold text-white [color-scheme:dark]" value={formCinnost.cas_od} onChange={e => setFormCinnost({...formCinnost, cas_od: e.target.value})} /><Clock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5"/></div>
                                     <div className="relative"><input type="time" className="w-full glass-input pl-10 pr-3 py-3 font-bold text-white [color-scheme:dark]" value={formCinnost.cas_do} onChange={e => setFormCinnost({...formCinnost, cas_do: e.target.value})} /><ArrowRight className="w-4 h-4 text-slate-500 absolute left-3 top-3.5"/></div>
                                </div>
                                <div className="relative">
                                    <input type="text" className="w-full glass-input pl-10 pr-3 py-3 text-sm font-medium" placeholder="Adresa (např. ZŠ Smetanova)" value={formCinnost.lokace} onChange={e => setFormCinnost({...formCinnost, lokace: e.target.value})} />
                                    <div className="absolute right-3 top-3.5 flex gap-2">
                                        {formCinnost.lokace && (<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formCinnost.lokace)}`} target="_blank" rel="noreferrer" title="Zkontrolovat na mapě"><ExternalLink className="w-4 h-4 text-blue-400 hover:text-white"/></a>)}
                                        <MapPin className="w-4 h-4 text-slate-500"/>
                                    </div>
                                </div>
                                {/* MAPA */}
                                {formCinnost.lokace.length > 3 && (
                                    <div className="mt-2 rounded-xl overflow-hidden border border-white/10 h-40 shadow-inner bg-black/20">
                                        <iframe width="100%" height="100%" frameBorder="0" scrolling="no" marginHeight="0" marginWidth="0" src={`https://maps.google.com/maps?q=${encodeURIComponent(formCinnost.lokace)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}></iframe>
                                    </div>
                                )}
                            </div>
                            
                            <SectionLabel icon={Users}>Statistiky</SectionLabel>
                            <div className="space-y-3">
                                <Stepper label="Počet svěřenců" value={formCinnost.pocet_sverencu} onChange={val => setFormCinnost({...formCinnost, pocet_sverencu: val})} />
                            </div>
                            
                            <SectionLabel icon={GraduationCap}>Rozsah (Automaticky)</SectionLabel>
                            <div className="flex gap-2">
                                <input type="date" className="glass-input p-2 text-xs flex-1 text-slate-400 [color-scheme:dark]" value={formCinnost.datum_od} onChange={e => setFormCinnost({...formCinnost, datum_od: e.target.value})} />
                                <input type="date" className="glass-input p-2 text-xs flex-1 text-slate-400 [color-scheme:dark]" value={formCinnost.datum_do} onChange={e => setFormCinnost({...formCinnost, datum_do: e.target.value})} />
                            </div>
                        </div>
                        
                        {/* 2. KALENDÁŘ */}
                        <div className="flex-1 flex flex-col bg-slate-900/30 relative min-h-[300px]">
                            <div className="p-4 bg-slate-900/60 backdrop-blur-md border-b border-white/5 flex justify-between items-center z-10 shadow-sm shrink-0">
                                <div className="flex items-center gap-3">
                                    <span className={`text-2xl font-black ${activeColor === 'blue' ? 'text-blue-500' : 'text-purple-500'}`}>{ziskaneKredity}</span>
                                    <div className="flex flex-col leading-tight"><span className="text-xs font-bold text-white uppercase">Kreditů celkem</span><span className="text-[10px] text-slate-400">{terminyPreview.filter(t=>t.aktivni).length} aktivních termínů</span></div>
                                </div>
                                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider bg-white/5 px-2 py-1 rounded">Kliknutím změníš</div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {terminyPreview.map((termin, index) => (
                                        <div key={index} onClick={() => toggleTermin(termin)} className={`relative p-3 rounded-xl border cursor-pointer transition-all duration-200 group select-none ${termin.aktivni ? `bg-slate-800/60 border-white/5 hover:bg-slate-800 hover:shadow-lg ${activeColor === 'blue' ? 'hover:border-blue-500/50 hover:shadow-blue-500/10' : 'hover:border-purple-500/50 hover:shadow-purple-500/10'}` : 'bg-red-500/5 border-red-500/10 hover:bg-red-500/10 opacity-60 grayscale'}`}>
                                            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${termin.aktivni ? `${activeColor === 'blue' ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white' : 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white'}` : 'bg-red-500/10 text-red-400'}`}>{termin.aktivni ? <Check className="w-4 h-4"/> : <CalendarOff className="w-4 h-4"/>}</div><div className="flex flex-col"><span className={`text-sm font-bold font-mono ${termin.aktivni ? 'text-white' : 'text-slate-500 line-through'}`}>{formatDate(termin.datum)}</span></div></div></div>
                                            {!termin.aktivni && termin.duvod && !termin.manualne && (<div className="mt-2 text-[10px] font-bold text-red-300 bg-red-500/10 px-2 py-1 rounded-md inline-block">{termin.duvod}</div>)}
                                            {!termin.aktivni && termin.manualne && (<div className="mt-2 text-[10px] font-bold text-orange-300 bg-orange-500/10 px-2 py-1 rounded-md inline-block">Zrušeno</div>)}
                                            {termin.aktivni && termin.manualne && (<div className="mt-2 text-[10px] font-bold text-green-300 bg-green-500/10 px-2 py-1 rounded-md inline-block">Obnoveno</div>)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-4 sm:p-6 border-t border-white/10 bg-slate-900/80 backdrop-blur-md absolute bottom-0 w-full lg:static shrink-0">
                                <button onClick={ulozitCinnost} className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl flex justify-center items-center gap-3 hover:scale-[1.02] transition-transform text-white ${activeColor === 'blue' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20'}`}><Save className="w-6 h-6"/> Uložit činnost</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- OSTATNÍ MODÁLY --- */}
        {potvrzovac && (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"><div className="glass-panel rounded-3xl p-8 w-full max-w-sm text-center transform transition-all scale-100"><div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${potvrzovac.type === 'danger' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>{potvrzovac.type === 'danger' ? <Trash2 className="w-8 h-8"/> : <HelpCircle className="w-8 h-8"/>}</div><h3 className="text-xl font-bold text-white mb-2">{potvrzovac.title}</h3><p className="text-slate-400 mb-8">{potvrzovac.desc}</p><div className="flex gap-3"><button onClick={potvrzovac.action} className={`flex-1 py-3 rounded-xl text-white font-bold transition-transform active:scale-95 ${potvrzovac.type === 'danger' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>Ano</button><button onClick={() => setPotvrzovac(null)} className="flex-1 py-3 btn-secondary rounded-xl font-bold">Zrušit</button></div></div></div>)}
        {modalProfil && ( <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"><div className="glass-panel rounded-3xl p-8 w-full max-w-lg relative"><button onClick={()=>setModalProfil(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X/></button><h3 className="text-xl font-bold text-white mb-6">Upravit profil</h3><div className="space-y-4"><div className="flex justify-center mb-6"><label className="cursor-pointer relative group"><img src={formOsoba.foto_url || 'https://via.placeholder.com/150'} className="w-24 h-24 rounded-full object-cover border-2 border-slate-600"/><div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white"/></div><input type="file" className="hidden" onChange={e => upload(e, 'avatary', url => setFormOsoba({...formOsoba, foto_url: url}))}/></label></div><div><label className="text-xs text-slate-400 uppercase font-bold">Klub</label><div className="relative mt-1"><select className="w-full glass-input rounded-xl p-3 appearance-none" value={formOsoba.klub_id || ''} onChange={e => setFormOsoba({...formOsoba, klub_id: e.target.value})}><option value="" className="bg-slate-900 text-slate-400">-- Bez klubu / Vybrat --</option>{klubyList.map(klub => (<option key={klub.id} value={klub.id} className="bg-slate-900 text-white">{klub.nazev}</option>))}</select></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="text-xs text-slate-400 uppercase font-bold">Email</label><input type="text" value={formOsoba.email||''} onChange={e=>setFormOsoba({...formOsoba, email:e.target.value})} className="w-full glass-input rounded-xl p-3 mt-1"/></div><div><label className="text-xs text-slate-400 uppercase font-bold">Telefon</label><input type="text" value={formOsoba.telefon||''} onChange={e=>setFormOsoba({...formOsoba, telefon:e.target.value})} className="w-full glass-input rounded-xl p-3 mt-1"/></div></div><div className="flex gap-2 pt-2"><button onClick={()=>setFormOsoba({...formOsoba, je_trener:!formOsoba.je_trener})} className={`flex-1 p-3 rounded-xl border font-bold text-sm ${formOsoba.je_trener?'bg-blue-600 border-blue-500 text-white':'bg-slate-800 border-slate-700 text-slate-500'}`}>Trenér</button><button onClick={()=>setFormOsoba({...formOsoba, je_rozhodci:!formOsoba.je_rozhodci})} className={`flex-1 p-3 rounded-xl border font-bold text-sm ${formOsoba.je_rozhodci?'bg-red-600 border-red-500 text-white':'bg-slate-800 border-slate-700 text-slate-500'}`}>Rozhodčí</button></div></div><div className="mt-8"><button onClick={ulozitProfil} className="w-full btn-primary py-3 rounded-xl font-bold">{loading?'...':'Uložit'}</button></div></div></div> )}
        {modalLicence && ( <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"><div className="glass-panel rounded-3xl p-8 w-full max-w-lg relative"><button onClick={()=>setModalLicence(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X/></button><h3 className="text-xl font-bold text-white mb-6">{formLicence.id ? 'Upravit' : 'Nová'} licence</h3><div className="space-y-4"><div className="flex bg-slate-900/50 p-1 rounded-xl mb-4 border border-white/5">{['Trenér', 'Rozhodčí'].map(r => (<button key={r} onClick={()=>setFormLicence({...formLicence, typ_role:r, uroven: r==='Trenér'?'C':'Národní'})} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formLicence.typ_role===r ? 'bg-slate-700 text-white shadow' : 'text-slate-500'}`}>{r}</button>))}</div><div><label className="text-xs text-slate-400 uppercase font-bold">Úroveň</label><div className="flex flex-wrap gap-2 mt-1">{['A', 'B', 'C', 'D'].map(opt => (<button key={opt} onClick={() => setFormLicence({...formLicence, uroven: opt})} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${formLicence.uroven === opt ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>{opt}</button>))}</div></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-slate-400 uppercase font-bold">Získáno</label><input type="date" value={formLicence.datum_ziskani||''} onChange={(e)=>setFormLicence({...formLicence, datum_ziskani:e.target.value})} className="w-full glass-input rounded-xl p-3 mt-1 [color-scheme:dark]"/></div><div><label className="text-xs text-slate-400 uppercase font-bold">Platí do {formLicence.typ_role === 'Trenér' && <span className="text-[10px] text-blue-400 ml-1">(počítá se automaticky)</span>}</label><input type="date" value={formLicence.platnost_do||''} onChange={e=>setFormLicence({...formLicence, platnost_do:e.target.value})} className="w-full glass-input rounded-xl p-3 mt-1 [color-scheme:dark]" readOnly={formLicence.typ_role === 'Trenér'} /></div></div><div><label className="flex items-center justify-center gap-2 w-full glass-input border-dashed hover:border-blue-500 rounded-xl p-4 text-slate-400 cursor-pointer mt-2"><Upload className="w-4 h-4"/> <span>{formLicence.certifikat_url ? 'Soubor nahrán (změnit)' : 'Nahrát certifikát'}</span><input type="file" className="hidden" onChange={e => upload(e, 'dokumenty', url => setFormLicence({...formLicence, certifikat_url: url}))}/></label></div></div><div className="mt-8"><button onClick={ulozitLicenci} className="w-full btn-primary py-3 rounded-xl font-bold">{loading?'...':'Uložit'}</button></div></div></div> )}

    </div>
  )
}

export default DetailOsoby
