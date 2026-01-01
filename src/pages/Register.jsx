import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Upload, FileText, Loader2, Save, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { vypocitatPlatnostLicence } from '../utils/dateUtils'

function Register() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [kluby, setKluby] = useState([])
    
    // Formulářová data
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        jmeno: '',
        prijmeni: '',
        klub_id: '',
        typ_role: 'Trenér',
        uroven: 'C',
        datum_ziskani: new Date().toISOString().split('T')[0]
    })
    
    const [file, setFile] = useState(null)

    useEffect(() => {
        const fetchKluby = async () => {
            const { data } = await supabase.from('kluby').select('*').order('nazev')
            if (data) setKluby(data)
        }
        fetchKluby()
    }, [])

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0])
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        if (!file) return toast.error("Musíte nahrát certifikát!")
        if (!formData.klub_id) return toast.error("Vyberte prosím klub.")

        setLoading(true)
        
        try {
            // 1. REGISTRACE (Auth)
            // Trigger v DB nyní zkontroluje e-mail:
            // - Pokud existuje: Propojí účet.
            // - Pokud neexistuje: Vytvoří nový řádek.
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            })
            if (authError) throw authError
            
            // Poznámka: Pokud máte vypnuté potvrzování e-mailů, user je hned v session.
            // Pokud ne, zde by se mohlo stát, že user je null. Předpokládáme vypnuté potvrzování nebo auto-login.
            const userId = authData.user?.id
            
            if (userId) {
                // 2. AKTUALIZACE ÚDAJŮ (Upsert logiky se nebojíme, prostě přepíšeme data tím, co zadal teď)
                // I když uživatel existoval, aktualizujeme mu jméno a klub (mohlo se změnit)
                const { error: profileError } = await supabase.from('osoby').update({
                    jmeno: formData.jmeno,
                    prijmeni: formData.prijmeni,
                    klub_id: formData.klub_id
                }).eq('email', formData.email) // Používáme email jako klíč pro jistotu
                
                if (profileError) throw profileError

                // 3. NAHRÁNÍ SOUBORU
                const fileExt = file.name.split('.').pop()
                const fileName = `${userId}_first_${Date.now()}.${fileExt}`
                
                const { error: uploadError } = await supabase.storage
                    .from('certifikaty')
                    .upload(fileName, file)
                if (uploadError) throw uploadError

                const { data: urlData } = supabase.storage
                    .from('certifikaty')
                    .getPublicUrl(fileName)

                // 4. VYTVOŘENÍ LICENCE
                const platnostDo = vypocitatPlatnostLicence(formData.datum_ziskani)
                
                const { error: licError } = await supabase.from('licence').insert([{
                    osoba_id: userId, // Tady pozor: Propojujeme to s Auth ID, což díky triggeru sedí i s Osoba ID
                    typ_role: formData.typ_role,
                    uroven: formData.uroven,
                    datum_ziskani: formData.datum_ziskani,
                    platnost_do: platnostDo,
                    certifikat_url: urlData.publicUrl,
                    aktivni: false,
                    schvaleno: false,
                    kredity: 0
                }])
                if (licError) throw licError

                toast.success("Registrace úspěšná! Vítejte.")
                navigate('/')
            } else {
                // Fallback pro případ, že je vyžadováno potvrzení e-mailu
                toast.success("Ověřovací e-mail odeslán! Klikněte na odkaz v e-mailu.")
                navigate('/login')
            }

        } catch (error) {
            console.error(error)
            toast.error(error.message || "Chyba při registraci")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 page-enter relative overflow-hidden">
             {/* Pozadí */}
             <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="glass-panel w-full max-w-lg p-8 rounded-3xl border border-white/10 relative z-10 bg-[#0f172a]/80 shadow-2xl">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-black text-white mb-2">Registrace</h1>
                    <p className="text-slate-400 text-sm mb-4">Aktivace účtu nebo nová registrace</p>
                    
                    {/* INFO BOX Z PŮVODNÍHO KÓDU */}
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex gap-3 text-left">
                        <Info className="w-5 h-5 text-blue-400 shrink-0"/>
                        <p className="text-xs text-blue-200 leading-relaxed">
                            <strong>Máte už historii?</strong> Použijte stejný e-mail, který je v evidenci. Váš účet se automaticky propojí.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                    
                    {/* 1. OSOBNÍ ÚDAJE */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-white/5 pb-2">1. Osobní údaje</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Jméno" className="glass-input w-full p-3 rounded-xl" value={formData.jmeno} onChange={e => setFormData({...formData, jmeno: e.target.value})} required />
                            <input type="text" placeholder="Příjmení" className="glass-input w-full p-3 rounded-xl" value={formData.prijmeni} onChange={e => setFormData({...formData, prijmeni: e.target.value})} required />
                        </div>
                        <select className="glass-input w-full p-3 rounded-xl bg-slate-900" value={formData.klub_id} onChange={e => setFormData({...formData, klub_id: e.target.value})} required>
                            <option value="">-- Vyberte klub --</option>
                            {kluby.map(k => <option key={k.id} value={k.id}>{k.nazev}</option>)}
                        </select>
                    </div>

                    {/* 2. EMAIL A HESLO */}
                    <div className="space-y-4">
                         <div className="grid grid-cols-1 gap-4">
                            <input type="email" placeholder="E-mail (pro párování účtu)" className="glass-input w-full p-3 rounded-xl" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                            <input type="password" placeholder="Heslo (min. 6 znaků)" className="glass-input w-full p-3 rounded-xl" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                        </div>
                    </div>

                    {/* 3. LICENCE */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider border-b border-white/5 pb-2 pt-2">2. Licence / Aktivace</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Role</label>
                                <select className="glass-input w-full p-3 rounded-xl bg-slate-900" value={formData.typ_role} onChange={e => setFormData({...formData, typ_role: e.target.value})}>
                                    <option value="Trenér">Trenér</option>
                                    <option value="Rozhodčí">Rozhodčí</option>
                                </select>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Úroveň</label>
                                <select className="glass-input w-full p-3 rounded-xl bg-slate-900" value={formData.uroven} onChange={e => setFormData({...formData, uroven: e.target.value})}>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                </select>
                             </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Datum získání</label>
                            <input type="date" className="glass-input w-full p-3 rounded-xl bg-slate-900" value={formData.datum_ziskani} onChange={e => setFormData({...formData, datum_ziskani: e.target.value})} required />
                        </div>

                        <div className={`border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:bg-white/5 transition-all ${file ? 'border-green-500/50 bg-green-500/5' : ''}`}>
                            <input type="file" id="reg-file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} required />
                            <label htmlFor="reg-file" className="cursor-pointer w-full h-full block">
                                {file ? (
                                    <div className="flex items-center justify-center gap-2 text-green-400 font-bold">
                                        <FileText className="w-5 h-5"/> {file.name}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        <Upload className="w-6 h-6 opacity-50"/>
                                        <span className="text-sm">Nahrát certifikát (Foto/PDF) *</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 mt-4">
                        {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <Save className="w-5 h-5"/>}
                        {loading ? 'Zpracovávám...' : 'Dokončit a odeslat'}
                    </button>

                    <div className="text-center mt-6">
                        <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Již máte účet? <span className="text-blue-400 font-bold">Přihlásit se</span></Link>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Register