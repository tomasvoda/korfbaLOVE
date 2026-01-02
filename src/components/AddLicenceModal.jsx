import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { X, Upload, Save, FileText, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { vypocitatPlatnostLicence } from '../utils/dateUtils'

export function AddLicenceModal({ osobaId, onClose, onSave }) {
    const [loading, setLoading] = useState(false)
    const [file, setFile] = useState(null)
    const [formData, setFormData] = useState({
        typ_role: 'Trenér',
        uroven: 'C',
        datum_ziskani: new Date().toISOString().split('T')[0]
    })

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            let certifikatUrl = null

            // 1. Nahrání souboru (pokud existuje)
            if (file) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${osobaId}_${Date.now()}.${fileExt}`
                const { error: uploadError } = await supabase.storage
                    .from('certifikaty')
                    .upload(fileName, file)

                if (uploadError) throw uploadError
                
                // Získání veřejné URL
                const { data: urlData } = supabase.storage
                    .from('certifikaty')
                    .getPublicUrl(fileName)
                
                certifikatUrl = urlData.publicUrl
            }

            // 2. Výpočet platnosti (automaticky)
            const platnostDo = vypocitatPlatnostLicence(formData.datum_ziskani)

            // 3. Uložení do DB
            const { error } = await supabase.from('licence').insert([{
                osoba_id: osobaId,
                typ_role: formData.typ_role,
                uroven: formData.uroven,
                datum_ziskani: formData.datum_ziskani,
                platnost_do: platnostDo,
                certifikat_url: certifikatUrl,
                aktivni: false, // Zatím neaktivní
                schvaleno: false, // Čeká na schválení
                kredity: 0
            }])

            if (error) throw error

            toast.success('Licence odeslána ke schválení!')
            onSave() // Refresh rodiče
            onClose()

        } catch (error) {
            console.error(error)
            toast.error('Chyba při ukládání: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden border border-white/10 bg-[#0f172a] shadow-2xl relative">
                
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-bold text-white">Přidat novou licenci</h2>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white"/></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    {/* Role a Úroveň */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Typ role</label>
                            <select className="glass-input w-full p-3 rounded-xl bg-slate-900" value={formData.typ_role} onChange={e => setFormData({...formData, typ_role: e.target.value})}>
                                <option value="Trenér">Trenér</option>
                                <option value="Rozhodčí">Rozhodčí</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Úroveň</label>
                            <select className="glass-input w-full p-3 rounded-xl bg-slate-900" value={formData.uroven} onChange={e => setFormData({...formData, uroven: e.target.value})}>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                            </select>
                        </div>
                    </div>

                    {/* Datum získání */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Datum získání</label>
                        <input type="date" className="glass-input w-full p-3 rounded-xl bg-slate-900" value={formData.datum_ziskani} onChange={e => setFormData({...formData, datum_ziskani: e.target.value})} required />
                    </div>

                    {/* Nahrání souboru */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Certifikát / Doklad (PDF, JPG)</label>
                        <div className={`border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:bg-white/5 transition-all ${file ? 'border-green-500/50 bg-green-500/5' : ''}`}>
                            <input type="file" id="cert-upload" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                            <label htmlFor="cert-upload" className="cursor-pointer w-full h-full block">
                                {file ? (
                                    <div className="flex items-center justify-center gap-2 text-green-400 font-bold">
                                        <FileText className="w-5 h-5"/> {file.name}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        <Upload className="w-8 h-8 opacity-50"/>
                                        <span className="text-sm">Klikněte pro nahrání souboru</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all">
                            {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <Save className="w-5 h-5"/>}
                            {loading ? 'Odesílám...' : 'Odeslat ke schválení'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
