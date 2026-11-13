'use client';

import React from 'react';
import { JobApplication, AppSettings } from '../types';

interface HeaderProps {
  applications: JobApplication[];
  selectedApp: JobApplication;
  onSelectApp: (app: JobApplication) => void;
  activeTab: 'resume' | 'followups' | 'networking';
  onChangeTab: (tab: 'resume' | 'followups' | 'networking') => void;
  onOpenSettings: () => void;
  onOpenSheetModal: () => void;
  onEnrichCurrentApp: () => void;
  isEnriching: boolean;
  settings: AppSettings;
}

export default function Header({
  applications,
  selectedApp,
  onSelectApp,
  activeTab,
  onChangeTab,
  onOpenSettings,
  onOpenSheetModal,
  onEnrichCurrentApp,
  isEnriching,
  settings,
}: HeaderProps) {
  const contact = selectedApp.contact;

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm no-print">
      {/* Top tier brand & controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">JobAid</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200">
                  AI Pipeline
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Sheet Sync • Apollo Enrichment • 1-Click Outreach</p>
            </div>
          </div>

          {/* Center: Active Application Selector */}
          <div className="flex-1 max-w-md hidden md:flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-400 pl-2 uppercase tracking-wider">Target:</span>
            <select
              value={selectedApp.id}
              onChange={(e) => {
                const found = applications.find(a => a.id === e.target.value);
                if (found) onSelectApp(found);
              }}
              aria-label="Target job application"
              className="w-full bg-white text-sm font-medium text-slate-800 rounded-lg px-3 py-1.5 border border-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.company} — {app.position} ({app.status})
                </option>
              ))}
            </select>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Apollo Enrichment Pill */}
            {contact ? (
              <div 
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800"
                title={`Enriched via ${contact.enrichedVia}: ${contact.name} (${contact.title})`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-emerald-900">{contact.name}</span>
                <span className="text-emerald-700 truncate max-w-[120px]">{contact.title}</span>
              </div>
            ) : (
              <button
                onClick={onEnrichCurrentApp}
                disabled={isEnriching}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold text-indigo-700 transition"
              >
                <svg className={`w-3.5 h-3.5 ${isEnriching ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {isEnriching ? 'Enriching...' : 'Enrich with Apollo'}
              </button>
            )}

            {/* Google Tracker Sheet Button */}
            <button
              onClick={onOpenSheetModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
              title="Open Google Sheet Application Tracker"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H6v-2h6v2zm4-4H6v-2h10v2zm0-4H6V7h10v2z"/>
              </svg>
              <span>Tracker Sheet ({applications.length})</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
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

        {/* Mobile active application dropdown */}
        <div className="pb-3 md:hidden">
          <select
            value={selectedApp.id}
            onChange={(e) => {
              const found = applications.find(a => a.id === e.target.value);
              if (found) onSelectApp(found);
            }}
            aria-label="Target job application mobile"
            className="w-full bg-white text-sm font-medium text-slate-800 rounded-lg px-3 py-2 border border-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.company} — {app.position} ({app.status})
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex border-t border-slate-100 gap-2 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => onChangeTab('resume')}
            className={`py-3 px-2 sm:px-4 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'resume'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
            <span>Resume & Cover Letter</span>
          </button>

          <button
            onClick={() => onChangeTab('followups')}
            className={`py-3 px-2 sm:px-4 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'followups'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">2</span>
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
            <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">3</span>
            <span>LinkedIn Networking</span>
          </button>
        </div>
      </div>
    </header>
  );
}
