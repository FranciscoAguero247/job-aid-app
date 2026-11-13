'use client';

import React, { useState } from 'react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}: SettingsModalProps) {
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [sheetUrl, setSheetUrl] = useState(settings.googleSheetUrl || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      geminiApiKey: geminiKey.trim(),
      googleSheetUrl: sheetUrl.trim(),
      lastSynced: settings.lastSynced,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              ⚙️
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pipeline Integrations & API Keys</h3>
              <p className="text-xs text-slate-500">Configure your Gemini key and Google Tracker Sheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings modal"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        <div className="py-5 space-y-5">
          {/* Gemini API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="gemini-key-input" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Gemini API Key (AI Engine)
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 hover:underline"
              >
                Get free key ↗
              </a>
            </div>
            <input
              id="gemini-key-input"
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800 placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Powering Resume tailoring, custom follow-ups, and the anti-jargon tone engine. If omitted, built-in intelligent templates are used.
            </p>
          </div>

          {/* Google Sheets URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="sheet-url-input" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Google Tracker Sheet URL
              </label>
              <span className="text-[11px] text-emerald-600 font-medium">Public or Shareable Link</span>
            </div>
            <input
              id="sheet-url-input"
              type="text"
              placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Tip: Set sheet sharing to &quot;Anyone with the link can view&quot;. Expected headers: Company, Role/Position, Status, Applied Date.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
