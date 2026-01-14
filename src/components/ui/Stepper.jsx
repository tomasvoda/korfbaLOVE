import React from 'react';
import { Minus, Plus } from 'lucide-react';

export const Stepper = ({ label, value, onChange }) => (
    <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-300">{label}</span>
        <div className="flex items-center gap-3">
            <button
                onClick={() => onChange(Math.max(1, value - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
                <Minus className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold w-6 text-center text-blue-200">{value}</span>
            <button
                onClick={() => onChange(value + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    </div>
);
