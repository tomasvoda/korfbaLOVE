import React from 'react';

export const ToggleGrid = ({ options, value, onChange }) => (
    <div className="grid grid-cols-4 gap-2">
        {options.map(opt => {
            const isSelected = String(value) === String(opt.value);
            return (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`py-2 px-1 rounded-lg text-xs font-bold transition-all border ${isSelected
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800/40 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                >
                    {opt.label}
                </button>
            )
        })}
    </div>
);
