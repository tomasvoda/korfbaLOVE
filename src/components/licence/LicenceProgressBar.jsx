import React from 'react';
import { TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

export const LicenceProgressBar = ({ stats }) => {
    const { current, projected, req, targets } = stats;

    const percentCurrent = req > 0 ? Math.min(100, (current / req) * 100) : 0;
    const percentProjected = req > 0 ? Math.min(100, (projected / req) * 100) : 0;

    const progressColor = percentCurrent >= 100 ? 'bg-green-500' : percentCurrent >= 50 ? 'bg-orange-500' : 'bg-red-500';
    const ghostColor = percentProjected >= 100 ? 'bg-green-400/30' : 'bg-white/10';

    return (
        <div className="p-6 md:p-8 border-t border-white/5 bg-slate-900/30">
            <div className="flex justify-between items-end mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${percentCurrent >= 100 ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-3xl font-black text-white leading-none tracking-tight">{current}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Nahráno kreditů</div>
                    </div>
                </div>

                <div className="text-right">
                    <div className="flex items-center justify-end gap-2 text-lg font-bold">
                        <span className={projected >= req ? "text-green-400" : "text-white"}>{projected}</span>
                        <span className="text-slate-600">/ {req}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase mt-1 flex items-center justify-end gap-1">
                        Cíl: {targets?.maintenance || '?'}
                        {projected >= req ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                    </div>
                </div>
            </div>

            {/* Lišta */}
            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden relative shadow-inner border border-white/5">
                {/* Ghost bar (Predikce) */}
                <div className={`absolute top-0 left-0 h-full ${ghostColor} transition-all duration-1000 ease-out`} style={{ width: `${percentProjected}%` }}></div>
                {/* Main bar (Skutečnost) */}
                <div className={`absolute top-0 left-0 h-full ${progressColor} transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,0,0,0.5)]`} style={{ width: `${percentCurrent}%` }}></div>
            </div>

            {/* Text pod lištou */}
            <div className="mt-4 flex items-center justify-between gap-4">
                <div className="text-xs font-medium text-slate-400">
                    {Math.max(0, req - current) > 0 ? (
                        <span>Zbývá získat <strong className="text-white">{Math.max(0, req - current)}</strong> kreditů</span>
                    ) : (
                        <span className="text-green-400 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Podmínky splněny</span>
                    )}
                </div>

                {/* Warning při nedostatku */}
                {targets && current < req && (
                    <div className="text-xs font-bold text-orange-400/80 bg-orange-400/10 px-2 py-1 rounded flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" />
                        Riziko sestupu na {targets.next || 'Nelicencovaný'}
                    </div>
                )}
            </div>
        </div>
    );
};
