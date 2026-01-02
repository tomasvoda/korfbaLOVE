import { useState } from 'react'
import { X, Save, Trash2, Calendar, Award, Star } from 'lucide-react'

export function LicenceEditModal({ licence, onClose, onSave, onDelete, isAdmin }) {
    // Inicializace stavu formuláře daty z licence
    const [formData, setFormData] = useState({
        platnost_do: licence.platnost_do ? new Date(licence.platnost_do).toISOString().split('T')[0] : '',
        uroven: licence.uroven || '',
        kredity: licence.kredity || 0,
        aktivni: licence.aktivni
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(licence.id, formData)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden border border-white/10 bg-[#0f172a] shadow-2xl relative">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h2 className="text-xl font-bold text-white">Úprava licence</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Datum platnosti */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Platnost do
                        </label>
                        <input
                            type="date"
                            className="glass-input w-full p-3 rounded-xl text-white font-mono bg-slate-900/50"
                            value={formData.platnost_do}
                            onChange={e => setFormData({ ...formData, platnost_do: e.target.value })}
                        />
                    </div>

                    {/* Úroveň a Kredity (Grid) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Award className="w-3 h-3" /> Úroveň
                            </label>
                            <div className="relative">
                                <select
                                    className="glass-input w-full p-3 pr-10 rounded-xl text-white font-bold bg-slate-900/50 appearance-none cursor-pointer hover:bg-slate-800/80 transition-colors"
                                    value={formData.uroven}
                                    onChange={e => setFormData({ ...formData, uroven: e.target.value })}
                                >
                                    <option className="bg-slate-900" value="A">A</option>
                                    <option className="bg-slate-900" value="B">B</option>
                                    <option className="bg-slate-900" value="C">C</option>
                                    <option className="bg-slate-900" value="D">D</option>
                                    <option className="bg-slate-900" value="Mezinárodní">Mezinárodní</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Star className="w-3 h-3" /> Kredity
                            </label>
                            <input
                                type="number"
                                className="glass-input w-full p-3 rounded-xl text-white font-mono bg-slate-900/50"
                                value={formData.kredity}
                                onChange={e => setFormData({ ...formData, kredity: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    {/* Checkbox Aktivní */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setFormData({ ...formData, aktivni: !formData.aktivni })}>
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${formData.aktivni ? 'bg-green-500 border-green-500' : 'border-slate-500'}`}>
                            {formData.aktivni && <X className="w-3 h-3 text-white rotate-45" strokeWidth={4} />}
                        </div>
                        <span className={`text-sm font-bold ${formData.aktivni ? 'text-white' : 'text-slate-400'}`}>Licence je aktivní</span>
                    </div>

                    {/* Tlačítka */}
                    <div className="pt-4 flex gap-3">
                        {isAdmin && (
                            <button type="button" onClick={() => onDelete(licence.id)} className="p-3.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all border border-red-500/20">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                        <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                            <Save className="w-5 h-5" /> Uložit změny
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
