import React from 'react';
import { X, Save, Calendar, Clock, Briefcase, Users } from 'lucide-react';
import { SectionLabel } from '../ui/SectionLabel';
import { ToggleGrid } from '../ui/ToggleGrid';
import { Stepper } from '../ui/Stepper';
import { getSezonyList, getLimitySezony } from '../../utils/dateUtils';

export const TrainingEditor = ({ formCinnost, setFormCinnost, onSave, onClose, ziskaneKredity, terminyPreview }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
            <div className="glass-panel w-full md:max-w-5xl h-full md:h-[90vh] flex flex-col md:rounded-3xl overflow-hidden bg-[#0f172a] border-none md:border border-white/10">
                <div className="p-4 bg-slate-900 border-b border-white/10 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold text-white">Editor tréninku</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="text-slate-400 hover:text-white w-6 h-6" /></button>
                </div>
                <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden overflow-y-auto">
                    <div className="w-full lg:w-1/2 p-4 md:p-6 lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-white/10 bg-slate-950/50 shrink-0">
                        <div className="space-y-6">
                            <div className="relative">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Sezóna</label>
                                <select className="w-full glass-input p-3 bg-slate-900 text-white" value={formCinnost.sezona} onChange={e => { const l = getLimitySezony(e.target.value); setFormCinnost({ ...formCinnost, sezona: e.target.value, datum_od: l.start, datum_do: l.end }) }}>
                                    {getSezonyList().map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <SectionLabel icon={Briefcase}>Kategorie</SectionLabel>
                            <ToggleGrid options={[{ value: 'U9', label: 'U9' }, { value: 'U11', label: 'U11' }, { value: 'U13', label: 'U13' }, { value: 'U16', label: 'U16' }, { value: 'U19', label: 'U19' }, { value: 'SEN', label: 'SEN' }]} value={formCinnost.kategorie} onChange={v => setFormCinnost({ ...formCinnost, kategorie: v })} />
                            <SectionLabel icon={Calendar}>Den</SectionLabel>
                            <ToggleGrid options={[{ value: '1', label: 'Po' }, { value: '2', label: 'Út' }, { value: '3', label: 'St' }, { value: '4', label: 'Čt' }, { value: '5', label: 'Pá' }, { value: '6', label: 'So' }, { value: '7', label: 'Ne' }]} value={formCinnost.den_v_tydnu} onChange={v => setFormCinnost({ ...formCinnost, den_v_tydnu: v })} />
                            <SectionLabel icon={Clock}>Čas a místo</SectionLabel>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="time" className="glass-input p-3" value={formCinnost.cas_od} onChange={e => setFormCinnost({ ...formCinnost, cas_od: e.target.value })} />
                                <input type="time" className="glass-input p-3" value={formCinnost.cas_do} onChange={e => setFormCinnost({ ...formCinnost, cas_do: e.target.value })} />
                            </div>
                            <input type="text" className="glass-input p-3 w-full mt-2" placeholder="Adresa místa konání" value={formCinnost.lokace} onChange={e => setFormCinnost({ ...formCinnost, lokace: e.target.value })} />
                            <SectionLabel icon={Users}>Počet</SectionLabel>
                            <Stepper label="Svěřenců" value={formCinnost.pocet_sverencu} onChange={v => setFormCinnost({ ...formCinnost, pocet_sverencu: v })} />
                        </div>
                    </div>
                    <div className="w-full lg:w-1/2 flex flex-col bg-slate-900/30 shrink-0">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                            <span className="text-2xl font-black text-purple-500">{ziskaneKredity} kr.</span>
                            <span className="text-xs text-slate-500 font-bold uppercase">{terminyPreview.filter(t => t.aktivni).length} termínů</span>
                        </div>
                        <div className="lg:flex-1 lg:overflow-y-auto p-4 custom-scrollbar">
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2">
                                {terminyPreview.map((t, i) => (
                                    <div key={i} onClick={() => { const n = [...(formCinnost.vynechane_datumy || [])]; if (n.includes(t.datum)) setFormCinnost({ ...formCinnost, vynechane_datumy: n.filter(d => d !== t.datum) }); else setFormCinnost({ ...formCinnost, vynechane_datumy: [...n, t.datum] }) }} className={`p-2 rounded-lg border text-[10px] font-bold text-center cursor-pointer ${t.aktivni ? 'bg-slate-800 border-white/10 text-white' : 'bg-red-900/10 border-red-500/10 text-red-500/50 line-through'}`}>
                                        {new Date(t.datum).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t border-white/10 bg-slate-900/50">
                            <button onClick={onSave} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all">
                                <Save className="w-5 h-5" /> Uložit trénink
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
