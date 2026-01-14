import React from 'react';

export const SectionLabel = ({ icon: Icon, children }) => (
    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 mt-6">
        <Icon className="w-3 h-3 text-blue-400" />
        {children}
    </div>
);
