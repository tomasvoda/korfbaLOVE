import { X, BookOpen, CheckCircle } from 'lucide-react'

export function CreditRulesModal({ onClose }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative flex flex-col">

                {/* Header */}
                <div className="sticky top-0 bg-[#0f172a]/95 backdrop-blur-xl p-6 border-b border-white/5 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-blue-400" /> Směrnice o licencích
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 text-slate-300 leading-relaxed">

                    <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl">
                        <h3 className="text-blue-400 font-bold mb-2">Kreditový systém trenérů</h3>
                        <p className="text-sm">
                            Pro obnovení licence je nutné v průběhu platnosti licence (3 roky) nasbírat stanovený počet kreditů.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-white font-bold mb-3 text-lg">Jak získat kredity?</h3>
                        <ul className="space-y-3">
                            <li className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-xs shrink-0">1</div>
                                <div>
                                    <strong className="text-white">1 kredit</strong> za každý den vedení tréninkové jednotky.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-xs shrink-0">3</div>
                                <div>
                                    <strong className="text-white">3 kredity</strong> za každý den vedení týmu v soutěžním zápase ČKS (jako hlavní trenér).
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-xs shrink-0">5</div>
                                <div>
                                    <strong className="text-white">5 kreditů</strong> za každý den vedení týmu v mezinárodním zápase (ČKS/IKF).
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-xs shrink-0">10</div>
                                <div>
                                    <strong className="text-white">10 kreditů</strong> za účast na vzdělávacím semináři.
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-xs shrink-0">10</div>
                                <div>
                                    <strong className="text-white">10 kreditů</strong> za publikační činnost (min. 4 NS).
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="border-t border-white/10 pt-6">
                        <h3 className="text-white font-bold mb-3 text-lg">Požadavky pro obnovení</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                                <div className="text-2xl font-black text-white mb-1">50</div>
                                <div className="text-xs text-slate-400 uppercase font-bold">Kreditů</div>
                                <div className="mt-2 text-sm font-bold text-blue-400">Licence D</div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                                <div className="text-2xl font-black text-white mb-1">100</div>
                                <div className="text-xs text-slate-400 uppercase font-bold">Kreditů</div>
                                <div className="mt-2 text-sm font-bold text-blue-400">Licence C</div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                                <div className="text-2xl font-black text-white mb-1">150</div>
                                <div className="text-xs text-slate-400 uppercase font-bold">Kreditů</div>
                                <div className="mt-2 text-sm font-bold text-blue-400">Licence B</div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-4 italic">
                            Pokud trenér nedosáhne požadovaného počtu kreditů, bude mu v následujícím cyklu přidělena nižší licence odpovídající získaným kreditům.
                        </p>
                    </div>

                </div>

                <div className="p-6 border-t border-white/5 bg-[#0f172a]">
                    <button onClick={onClose} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors">
                        Rozumím
                    </button>
                </div>
            </div>
        </div>
    )
}
