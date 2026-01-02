import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { X, Save, Loader2, Trophy, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { getAktualniSezona } from '../utils/dateUtils'

export function AddActivityModal({ osobaId, onClose, onSave }) {
    const [loading, setLoading] = useState(false)
    const [typ, setTyp] = useState('zapas_cks') // zapas_cks, zapas_int

    // Defaultní hodnoty
    const [formData, setFormData] = useState({
        datum_od: new Date().toISOString().split('T')[0],
        datum_do: new Date().toISOString().split('T')[0],
        popis: '', // Použijeme jako 'kategorie' nebo 'lokace' podle kontextu
        pocet_jednotek: 1
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const sezona = getAktualniSezona().nazev

            // LOGIKA PRO ZÁPASY -> TABULKA 'aktivity'
            if (typ === 'zapas_cks' || typ === 'zapas_int' || typ === 'publikace') {
                let kredity = 0
                if (typ === 'zapas_int') kredity = 5
                else if (typ === 'zapas_cks') kredity = 3
                else if (typ === 'publikace') kredity = 10

                const payload = {
                    osoba_id: osobaId,
                    datum: formData.datum_od,
                    typ_aktivity: typ, // Correct column name matches existing DB
                    popis: formData.popis || (typ === 'zapas_int' ? 'Mezinárodní zápas' : (typ === 'publikace' ? 'Odborná publikace' : 'Zápas ČKS')),
                    kredity: kredity
                }

                const { error } = await supabase.from('aktivity').insert([payload])
                if (error) throw error

            } else {
                // LOGIKA PRO TRÉNINKY -> TABULKA 'cinnosti' (původní)
                const payload = {
                    osoba_id: osobaId,
                    role: 'Trenér',
                    sezona: sezona,
                    typ_aktivity: typ,
                    datum_od: formData.datum_od,
                    datum_do: formData.datum_od, // Defaultně stejně
                    created_at: new Date().toISOString()
                }

                if (typ === 'trenink') {
                    payload.kategorie = formData.popis || 'Individuální trénink'
                    payload.den_v_tydnu = new Date(formData.datum_od).getDay()
                    payload.datum_do = formData.datum_od
                }

                const { error } = await supabase.from('cinnosti').insert([payload])
                if (error) throw error
            }

            toast.success('Aktivita přidána!')
            onSave()
            onClose()

        } catch (error) {
            console.error(error)
            toast.error('Chyba: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden border border-white/10 bg-[#0f172a] shadow-2xl relative">

                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-bold text-white">Zapsat aktivitu (kredity)</h2>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Výběr typu */}
                    {/* Výběr typu - POUZE ZÁPASY */}
                    <div className="grid grid-cols-3 gap-2">
                        <button type="button" onClick={() => setTyp('zapas_cks')} className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${typ === 'zapas_cks' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                            <Trophy className="w-6 h-6" /> Zápas ČKS
                        </button>
                        <button type="button" onClick={() => setTyp('zapas_int')} className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${typ === 'zapas_int' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                            <Trophy className="w-6 h-6 text-yellow-400" /> Mezinárodní
                        </button>
                        <button type="button" onClick={() => setTyp('publikace')} className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${typ === 'publikace' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>
                            <BookOpen className="w-6 h-6 text-purple-200" /> Publikace
                        </button>
                    </div>

                    {/* Datum */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Datum</label>
                        <input type="date" className="glass-input w-full p-3 rounded-xl bg-slate-900" value={formData.datum_od} onChange={e => setFormData({ ...formData, datum_od: e.target.value })} required />
                    </div>

                    {/* Popis / Název */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">
                            {typ === 'publikace' ? 'Název publikace' : (typ === 'seminar' ? 'Název semináře' : 'Popis / Soupeř / Tým')}
                        </label>
                        <input type="text" className="glass-input w-full p-3 rounded-xl bg-slate-900" placeholder={typ === 'publikace' ? 'Např. Metodika střelby...' : 'Např. Proti KK Brno...'} value={formData.popis} onChange={e => setFormData({ ...formData, popis: e.target.value })} required />
                    </div>

                    <div className="pt-2">
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all">
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                            {loading ? 'Ukládám...' : 'Uložit aktivitu'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
