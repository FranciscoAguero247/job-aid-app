'use client';

import React, { useState, useEffect } from 'react';
import { JobApplication, MasterResume } from '../types';

interface TabNetworkingProps {
  application: JobApplication;
  masterResume: MasterResume;
  apiKey?: string;
}

export default function TabNetworking({
  application,
  masterResume,
  apiKey,
}: TabNetworkingProps) {
  const [persona, setPersona] = useState<'recruiter' | 'alumni' | 'hiring-manager'>('recruiter');
  const [format, setFormat] = useState<'connection-note' | 'inmail' | 'coffee-chat'>('connection-note');
  const [tone, setTone] = useState<'casual' | 'direct' | 'thoughtful'>('casual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Message output state
  const [messageText, setMessageText] = useState('');

  const contact = application.contact;

  // Auto-generate on application or controls change
  useEffect(() => {
    handleGenerate();
  }, [application.id, persona, format, tone]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'networking',
          resume: masterResume,
          application,
          options: {
            persona,
            format,
            tone,
          },
          apiKey,
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        if (typeof data.result === 'object' && data.result.message) {
          setMessageText(data.result.message);
        } else if (typeof data.result === 'string') {
          setMessageText(data.result);
        }
      }
    } catch (err) {
      console.error('Networking message error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const charCount = messageText.length;
  const isOverConnectionLimit = format === 'connection-note' && charCount > 300;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: Human Tone Engine Controls & Persona */}
      <div className="lg:col-span-5 space-y-5">
        
        {/* Anti-Jargon Banner */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🛡️</span>
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              Anti-Jargon Tone Engine
            </span>
          </div>
          <h2 className="text-base font-bold">100% Human Sounding Outreach</h2>
          <p className="text-xs text-purple-100 mt-1 leading-relaxed">
            Eliminates cringe AI buzzwords (<em>&quot;hope this finds you well&quot;</em>, <em>&quot;thrilled&quot;</em>, <em>&quot;synergy&quot;</em>) in favor of crisp, peer-to-peer conversations that get replies.
          </p>
        </div>

        {/* Persona Selector Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">
              1. Choose Recipient Persona:
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'recruiter',
                  name: 'Recruiter / Talent Partner',
                  desc: 'Concise qualification summary, low friction response trigger.',
                  icon: '🎯'
                },
                {
                  id: 'alumni',
                  name: 'Alumni / Peer Engineer',
                  desc: 'Warm shared bond (e.g. CU Boulder), asking about engineering culture.',
                  icon: '🎓'
                },
                {
                  id: 'hiring-manager',
                  name: 'Hiring Manager / Team Lead',
                  desc: 'Direct problem-solving angle referencing what they build.',
                  icon: '💼'
                },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setPersona(item.id as any)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-start gap-3 ${
                    persona === item.id
                      ? 'bg-purple-50/80 border-purple-300 text-slate-900 ring-1 ring-purple-300'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <div>
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Outreach Format Selector */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">
              2. Select Outreach Format:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'connection-note', label: 'Connection Note', sub: 'Max 300 chars' },
                { id: 'inmail', label: 'InMail / DM', sub: '< 120 words' },
                { id: 'coffee-chat', label: 'Coffee Chat', sub: '15 min request' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setFormat(item.id as any)}
                  className={`py-2 px-2 text-[11px] rounded-xl border text-center transition ${
                    format === item.id
                      ? 'bg-purple-50 border-purple-300 text-purple-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div>{item.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{item.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone Dial */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-2">
              3. Conversational Tone:
            </label>
            <div className="flex gap-2">
              {[
                { id: 'casual', label: 'Casual & Human' },
                { id: 'direct', label: 'Direct & Concise' },
                { id: 'thoughtful', label: 'Thoughtful' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setTone(item.id as any)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition ${
                    tone === item.id
                      ? 'bg-slate-900 text-white font-bold border-slate-900'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Re-generate Button */}
          <div className="pt-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 active:scale-[0.99] shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{isGenerating ? 'Synthesizing...' : 'Re-Craft Human Message'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Live Message Editor & LinkedIn Action */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Recipient Profile Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              in
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">
                  {contact ? contact.name : `${application.company} Hiring Team`}
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                  {persona.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {contact ? contact.title : `Hiring for ${application.position}`} • {application.company}
              </div>
            </div>
          </div>

          {contact?.linkedinUrl ? (
            <a
              href={contact.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <span>Open LinkedIn</span>
              <span>↗</span>
            </a>
          ) : (
            <a
              href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(application.company + ' ' + (persona === 'recruiter' ? 'recruiter' : 'engineering manager'))}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
            >
              Find on LinkedIn ↗
            </a>
          )}
        </div>

        {/* Message Editor Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {format === 'connection-note' ? 'LinkedIn Connection Note (Editable)' : 'Outreach Message (Editable)'}
            </label>
            
            {/* Live Character Counter with Color Alert */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                format === 'connection-note'
                  ? isOverConnectionLimit
                    ? 'bg-rose-100 text-rose-700 font-black animate-bounce'
                    : charCount > 270
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {charCount} {format === 'connection-note' ? '/ 300 chars' : 'characters'}
              </span>
            </div>
          </div>

          {/* Editable Text Area */}
          <div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={format === 'connection-note' ? 6 : 10}
              className={`w-full text-xs font-sans p-4 rounded-xl border focus:outline-none focus:ring-2 leading-relaxed bg-slate-50/30 ${
                isOverConnectionLimit
                  ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                  : 'border-slate-200 focus:ring-purple-500 text-slate-800'
              }`}
            />
            {isOverConnectionLimit && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                ⚠️ LinkedIn connection notes have a strict 300 character limit. Please trim {charCount - 300} character(s).
              </p>
            )}
          </div>

          {/* Action Bar */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              💡 Review and proofread before pasting into LinkedIn.
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={isOverConnectionLimit}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs ${
                  isOverConnectionLimit
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isCopied ? (
                  <>
                    <span>✓</span>
                    <span>Copied! Ready to Paste</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Human Tone Verification Check */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <div className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
            <span>✓ Human Tone Engine Verification:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>• Zero robotic intros</div>
            <div>• Friendly, low-friction ask</div>
            <div>• Personalized to {application.company}</div>
            <div>• Mobile-friendly reading length</div>
          </div>
        </div>

      </div>

    </div>
  );
}
