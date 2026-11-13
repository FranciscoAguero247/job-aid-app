'use client';

import React from 'react';
import { JobApplication, AppSettings, MasterResume } from '../types';

interface HeaderProps {
  applications: JobApplication[];
  selectedApp: JobApplication;
  onSelectApp: (app: JobApplication) => void;
  activeTab: 'fast-apply' | 'pipeline' | 'followups' | 'networking';
  onChangeTab: (tab: 'fast-apply' | 'pipeline' | 'followups' | 'networking') => void;
  onOpenSettings: () => void;
  onOpenSheetModal: () => void;
  onOpenResumeModal: () => void;
  onEnrichCurrentApp: () => void;
  isEnriching: boolean;
  settings: AppSettings;
  masterResume: MasterResume;
}

export default function Header({
  applications,
  selectedApp,
  onSelectApp,
  activeTab,
  onChangeTab,
  onOpenSettings,
  onOpenSheetModal,
  onOpenResumeModal,
  onEnrichCurrentApp,
  isEnriching,
  settings,
  masterResume,
}: HeaderProps) {
  const contact = selectedApp?.contact;

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
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  Co-Pilot
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Plug & Play Resume Tailoring • PDF Kits • Follow-Ups</p>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Master Resume Button */}
            <button
              onClick={onOpenResumeModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition"
              title="Upload or Edit your Master Resume"
            >
              <span>📄</span>
              <span className="hidden sm:inline">Resume:</span>
              <span className="max-w-[120px] truncate">{masterResume?.fullName || 'Upload'}</span>
            </button>

            {/* Google Tracker Sheet Button */}
            <button
              onClick={onOpenSheetModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
              title="Open Google Sheet Application Tracker"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H6v-2h6v2zm4-4H6v-2h10v2zm0-4H6V7h10v2z"/>
              </svg>
              <span>Tracker ({applications.length})</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
              title="API Keys & Integrations"
              aria-label="API Keys and Integration Settings"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex border-t border-slate-100 gap-2 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => onChangeTab('fast-apply')}
            className={`py-3 px-2 sm:px-4 border-b-2 text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'fast-apply'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-black">⚡</span>
            <span>Fast Apply (Plug & Play)</span>
          </button>

          <button
            onClick={() => onChangeTab('pipeline')}
            className={`py-3 px-2 sm:px-4 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'pipeline'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">📋</span>
            <span>Tracked Applications ({applications.length})</span>
          </button>

          <button
            onClick={() => onChangeTab('followups')}
            className={`py-3 px-2 sm:px-4 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'followups'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">⏳</span>
            <span>Custom Follow-Ups</span>
          </button>

          <button
            onClick={() => onChangeTab('networking')}
            className={`py-3 px-2 sm:px-4 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'networking'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">💬</span>
            <span>LinkedIn Networking</span>
          </button>
        </div>
      </div>
    </header>
  );
}
