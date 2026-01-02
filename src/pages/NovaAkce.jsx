import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft, Calendar, Save, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

function NovaAkce() {
    const navigate = useNavigate()
    const { isAdmin } = useAuth()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        nazev: '',
        popis: '',
        datum_od: '',
        cas_od: '09:00',
        misto: '',
        typ: 'skoleni',
        kredity: 0,
        kapacita: 0,
        cena: 0
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!isAdmin) return
        setLoading(true)

        try {
            // Sestavení timestampu
            const datumOdFull = new Date(`${formData.datum_od}T${formData.cas_od}:00`).toISOString()

            const { error } = await supabase
                .from('akce')
                .insert([{
                    nazev: formData.nazev,
                    popis: formData.popis,
                    datum_od: datumOdFull,
                    misto: formData.misto,
                    typ: formData.typ,
                    kredity: parseInt(formData.kredity),
                    kapacita: parseInt(formData.kapacita) || null,
                    cena: parseInt(formData.cena) || 0
                }])

            if (error) throw error
            toast.success('Akce vytvořena!')
            navigate('/akce')
        } catch (error) {
            console.error(error)
            toast.error('Chyba při vytváření akce')
        } finally {
            setLoading(false)
        }
    }

    if (!isAdmin) return <div className="p-10 text-center text-red-500">Nemáte oprávnění.</div>

    return (
        <div className="max-w-2xl mx-auto p-4 pb-32 pt-8 page-enter">
            <button onClick={() => navigate('/akce')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                <ArrowLeft className="w-5 h-5" /> Zpět
            </button>

            <h1 className="text-3xl font-black text-white mb-8 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-500" /> Nová akce
            </h1>

            <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">

                {/* Název */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Název akce</label>
                    <input
                        type="text"
                        name="nazev"
                        required
                        value={formData.nazev}
                        onChange={handleChange}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Např. Školení rozhodčích C"
                    />
                </div>

                {/* Typ a Místo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Typ akce</label>
                        <select
                            name="typ"
                            value={formData.typ}
                            onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                        >
                            <option value="skoleni">Školení</option>
                            <option value="seminar">Seminář</option>
                            <option value="turnaj">Turnaj</option>
                            <option value="ine">Jiné</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Místo konání</label>
                        <input
                            type="text"
                            name="misto"
                            required
                            value={formData.misto}
                            onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                            placeholder="Např. Brno, Hala Vodova"
                        />
                    </div>
                </div>

                {/* Datum a Čas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Datum</label>
                        <input
                            type="date"
                            name="datum_od"
                            required
                            value={formData.datum_od}
                            onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Čas začátku</label>
                        <input
                            type="time"
                            name="cas_od"
                            required
                            value={formData.cas_od}
                            onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Kredity, Kapacita, Cena */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Kredity</label>
                        <input
                            type="number"
                            name="kredity"
                            min="0"
                            value={formData.kredity}
                            onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Kapacita</label>
                        <input
                            type="number"
                            name="kapacita"
                            min="0"
                            placeholder="Neomezeno"
                            value={formData.kapacita}
                            onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Cena (Kč)</label>
                        <input
                            type="number"
                            name="cena"
                            min="0"
                            value={formData.cena}
                            onChange={handleChange}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Popis */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Popis a detaily</label>
                    <textarea
                        name="popis"
                        rows="5"
                        value={formData.popis}
                        onChange={handleChange}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                        placeholder="Podrobnější informace o akci..."
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Vytvořit akci</>}
                </button>

            </form>
        </div>
    )
}

export default NovaAkce
