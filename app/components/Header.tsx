'use client';

import React from 'react';

export default function Header() {

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm no-print">
      {/* Top tier brand & controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-lg">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">JobAid</span>
              </div>
            </div>
          </div>

          {/* Minimal status area */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              MVP
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
