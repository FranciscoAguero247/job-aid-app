'use client';

import React, { useState, useEffect } from 'react';
import { JobApplication, MasterResume } from '../types';

interface TabFollowUpsProps {
  application: JobApplication;
  masterResume: MasterResume;
  onUpdateAppContactDate: (appId: string, newDate: string) => void;
  apiKey?: string;
}

export default function TabFollowUps({
  application,
  masterResume,
  onUpdateAppContactDate,
  apiKey,
}: TabFollowUpsProps) {
  const [scenario, setScenario] = useState<'check-in' | 'value-add' | 'post-interview' | 'breakup'>('check-in');
  const [recipientType, setRecipientType] = useState<'hiring-manager' | 'recruiter' | 'general'>('hiring-manager');
  const [customContext, setCustomContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  // Follow-up message state
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [timingTip, setTimingTip] = useState('');

  // Calculate days elapsed since application date
  const appliedDate = new Date(application.appliedDate);
  const today = new Date();
  const diffDays = Math.max(0, Math.floor((today.getTime() - appliedDate.getTime()) / (1000 * 3600 * 24)));

  // Auto recommend scenario based on days or status
  useEffect(() => {
    if (application.status === 'Technical Interview' || application.status === 'Recruiter Screen') {
      setScenario('post-interview');
    } else if (diffDays >= 15) {
      setScenario('breakup');
    } else if (diffDays >= 8) {
      setScenario('value-add');
    } else {
      setScenario('check-in');
    }
  }, [application.id, diffDays, application.status]);

  // Trigger generation whenever application or scenario changes
  useEffect(() => {
    handleGenerate();
  }, [application.id, scenario, recipientType]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'follow-up',
          resume: masterResume,
          application,
          options: {
            scenario,
            recipientType,
            customContext,
          },
          apiKey,
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        setSubject(data.result.subject || `Following up: ${application.position} at ${application.company}`);
        setBodyText(data.result.body || '');
        setTimingTip(data.result.timingTip || 'Send during business hours (Tuesday–Thursday 9am–11am local time).');
      }
    } catch (err) {
      console.error('Follow-up generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    const fullText = `Subject: ${subject}\n\n${bodyText}`;
    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleLogFollowUp = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    onUpdateAppContactDate(application.id, todayStr);
    setIsLogged(true);
    setTimeout(() => setIsLogged(false), 3000);
  };

  const contact = application.contact;
  const recipientEmail = contact?.email || '';
  const mailtoLink = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: Context & Follow-Up Strategy */}
      <div className="lg:col-span-5 space-y-5">
        
        {/* Timeline Awareness Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Timeline Intelligence
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1.5">{application.company}</h2>
              <p className="text-xs text-slate-500">{application.position}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-slate-900">{diffDays}d</div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Since Applied</div>
            </div>
          </div>

          {/* Timeline Visual Status */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between text-slate-600 mb-1">
              <span className="font-semibold">Applied Date:</span>
              <span className="font-mono">{application.appliedDate}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold">Current Pipeline Stage:</span>
              <span className="font-bold text-blue-600">{application.status}</span>
            </div>
          </div>

          {/* Scenario Selector */}
          <div className="mt-5">
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Select Follow-Up Objective:
            </label>
            <div className="space-y-2">
              {[
                {
                  id: 'check-in',
                  label: 'Polite Status Check-in',
                  desc: 'Day 5-8 post-apply • Reaffirms enthusiasm, low pressure.',
                  badge: 'Recommended Day 5-8'
                },
                {
                  id: 'value-add',
                  label: 'Value-Add Insight Note',
                  desc: 'Day 8-14 • Shares relevant technical thought or portfolio win.',
                  badge: 'Day 8-14'
                },
                {
                  id: 'post-interview',
                  label: 'Post-Interview Thank You',
                  desc: 'Within 24-48h • References key discussion points & team goals.',
                  badge: 'Post-Interview'
                },
                {
                  id: 'breakup',
                  label: 'Graceful Re-engagement / Closure',
                  desc: 'Day 20+ • Friendly "closing the loop" email.',
                  badge: 'Day 20+'
                },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setScenario(item.id as any)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-start justify-between ${
                    scenario === item.id
                      ? 'bg-amber-50/70 border-amber-300 text-slate-900 ring-1 ring-amber-300'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{item.label}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${
                    scenario === item.id ? 'bg-amber-200/80 text-amber-900 font-bold' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Targeting */}
          <div className="mt-5">
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Target Recipient:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setRecipientType('hiring-manager')}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border transition ${
                  recipientType === 'hiring-manager'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Hiring Lead {contact ? `(${contact.name.split(' ')[0]})` : ''}
              </button>
              <button
                onClick={() => setRecipientType('recruiter')}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border transition ${
                  recipientType === 'recruiter'
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Recruiter
              </button>
            </div>
          </div>

          {/* Custom Context / Talking Points */}
          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Add Personal Talking Point (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Loved their recent blog post on WebSocket architecture..."
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
            />
          </div>

          {/* Regenerate Button */}
          <div className="mt-5">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.99] shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{isGenerating ? 'Drafting Follow-up...' : 'Generate Contextual Draft'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* RIGHT COLUMN: Editable Draft & One-Click Dispatch */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Recipient Overview Badge */}
        {contact && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                {contact.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{contact.name}</span>
                  <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-semibold">
                    Apollo Enriched
                  </span>
                </div>
                <div className="text-xs text-slate-500">{contact.title} • <span className="font-mono text-slate-600">{contact.email}</span></div>
              </div>
            </div>

            {contact.linkedinUrl && (
              <a
                href={contact.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-blue-600 hover:underline px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                LinkedIn Profile ↗
              </a>
            )}
          </div>
        )}

        {/* Timing Tip Alert */}
        {timingTip && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
            <span className="text-base">💡</span>
            <div>
              <span className="font-bold">Strategic Timing Tip:</span> {timingTip}
            </div>
          </div>
        )}

        {/* Follow-Up Editor Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          
          {/* Subject Line */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
              Subject Line:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(subject);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 whitespace-nowrap"
                title="Copy Subject Only"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Email Body (Editable Text Box) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Message Body (Editable for Quick Copy-Pasting):
              </label>
              <span className="text-[11px] text-slate-400">
                {bodyText.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={12}
              className="w-full text-xs font-sans p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 leading-relaxed bg-slate-50/30"
            />
          </div>

          {/* Action Buttons Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            <button
              onClick={handleLogFollowUp}
              className={`text-xs font-semibold px-3 py-2 rounded-xl border transition flex items-center gap-1.5 ${
                isLogged
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{isLogged ? '✓ Follow-Up Logged!' : '📅 Log Contact Date'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 flex items-center gap-1.5 transition"
              >
                {isCopied ? (
                  <>
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>Copy All</span>
                  </>
                )}
              </button>

              {contact?.email && (
                <a
                  href={mailtoLink}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs flex items-center gap-1.5 transition"
                >
                  <span>✉️</span>
                  <span>Open in Mail</span>
                </a>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
