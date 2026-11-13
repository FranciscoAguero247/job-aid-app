'use client';

import React, { useState, useEffect } from 'react';
import { JobApplication, MasterResume } from '../types';

interface TabResumeCoverLetterProps {
  application: JobApplication;
  masterResume: MasterResume;
  onUpdateJobDescription: (newJd: string) => void;
  apiKey?: string;
}

export default function TabResumeCoverLetter({
  application,
  masterResume,
  onUpdateJobDescription,
  apiKey,
}: TabResumeCoverLetterProps) {
  const [mode, setMode] = useState<'resume' | 'cover-letter'>('resume');
  const [tone, setTone] = useState<'impact' | 'technical' | 'leadership'>('impact');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showRawEditor, setShowRawEditor] = useState(false);
  
  // Output content state (editable by the user)
  const [generatedResume, setGeneratedResume] = useState<string>('');
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string>('');
  const [matchScore, setMatchScore] = useState<number>(application.matchScore || 92);

  // Auto-generate initial draft if empty when switching jobs
  useEffect(() => {
    handleGenerate(mode);
  }, [application.id, mode]);

  const handleGenerate = async (currentMode: 'resume' | 'cover-letter') => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: currentMode === 'resume' ? 'resume' : 'cover-letter',
          resume: masterResume,
          application,
          options: { focusTone: tone },
          apiKey,
        }),
      });

      const data = await res.json();
      if (data.success && data.result) {
        if (currentMode === 'resume') {
          setGeneratedResume(data.result);
        } else {
          setGeneratedCoverLetter(data.result);
        }
      }
    } catch (err) {
      console.error('Failed to generate:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentContent = mode === 'resume' ? generatedResume : generatedCoverLetter;
  const setCurrentContent = (val: string) => {
    if (mode === 'resume') setGeneratedResume(val);
    else setGeneratedCoverLetter(val);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  // Extract key aligned tech terms for visual chips
  const alignedKeywords = ['React 19', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Latency Optimization', 'CI/CD Pipelines', 'REST & GraphQL'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: Inputs & Customization Controls */}
      <div className="lg:col-span-5 space-y-5 no-print">
        
        {/* Active Context Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Target Role
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">{application.position}</h2>
              <p className="text-xs text-slate-500 font-medium">{application.company} • {application.location}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-emerald-600">{matchScore}%</div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Match Score</div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="mt-4 flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setMode('resume')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                mode === 'resume'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📄 Tailored Resume
            </button>
            <button
              onClick={() => setMode('cover-letter')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                mode === 'cover-letter'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ✉️ Cover Letter
            </button>
          </div>

          {/* Tone Strategy Selector */}
          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Alignment Focus:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'impact', label: 'Scale & Metrics' },
                { id: 'technical', label: 'Deep Architecture' },
                { id: 'leadership', label: 'Team Leadership' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setTone(item.id as any)}
                  className={`py-2 px-2 text-[11px] font-medium rounded-lg border text-center transition ${
                    tone === item.id
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-5">
            <button
              onClick={() => handleGenerate(mode)}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{isGenerating ? 'Synthesizing with AI...' : `Re-Generate ${mode === 'resume' ? 'Tailored Resume' : 'Cover Letter'}`}</span>
            </button>
          </div>
        </div>

        {/* Target Job Description Editor */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>Target Job Description</span>
              <span className="text-[10px] text-slate-400 font-normal">(Editable)</span>
            </label>
            <span className="text-[10px] text-slate-400">Pulled from Tracker Sheet</span>
          </div>
          <textarea
            value={application.jobDescription}
            onChange={(e) => onUpdateJobDescription(e.target.value)}
            rows={8}
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-700 bg-slate-50/50 leading-relaxed"
            placeholder="Paste target job description qualifications and responsibilities..."
          />
        </div>

        {/* Master Resume Snapshot Info */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                AR
              </div>
              <div>
                <div className="font-bold text-slate-800">{masterResume.fullName}</div>
                <div className="text-[10px] text-slate-400">Master Resume (Apex Cloud, Nexus Labs)</div>
              </div>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
              Ready
            </span>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Review, Proofreading, and Export Preview */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Controls Toolbar */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
          
          {/* Matched Keywords chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full sm:max-w-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Matched:</span>
            {alignedKeywords.slice(0, 4).map(kw => (
              <span key={kw} className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                ✓ {kw}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowRawEditor(!showRawEditor)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition"
              title="Toggle Markdown Edit / Formatted Document View"
            >
              {showRawEditor ? '👁️ Preview' : '✏️ Edit Text'}
            </button>

            <button
              onClick={handleCopy}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-1.5 transition"
            >
              {isCopied ? (
                <>
                  <span className="text-emerald-600">✓</span>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Dedicated Download as PDF button */}
            <button
              onClick={handleDownloadPDF}
              className="text-xs px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition"
              title="Download ATS-Friendly PDF"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download as PDF</span>
            </button>
          </div>
        </div>

        {/* Editable Review Box & Document Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden pdf-export-content">
          
          {showRawEditor ? (
            /* Direct raw markdown text editor */
            <div className="p-4 no-print">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500">Live Editor (Markdown / Plain Text)</span>
                <span className="text-[11px] text-slate-400">Edits update export preview instantly</span>
              </div>
              <textarea
                value={currentContent}
                onChange={(e) => setCurrentContent(e.target.value)}
                rows={24}
                className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 leading-relaxed"
              />
            </div>
          ) : (
            /* Formatted Document View - Prints cleanly as 1-page PDF */
            <div className="p-8 sm:p-10 font-sans text-slate-900 bg-white">
              {mode === 'resume' ? (
                /* ATS-Optimized Clean Resume Layout */
                <div className="space-y-6">
                  {/* Header */}
                  <div className="border-b border-slate-300 pb-4 text-center sm:text-left">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">{masterResume.fullName}</h1>
                    <div className="text-xs font-bold text-blue-700 mt-0.5 uppercase tracking-wide">
                      {application.position} Candidate
                    </div>
                    <div className="text-xs text-slate-600 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 justify-center sm:justify-start">
                      <span>{masterResume.location}</span>
                      <span>•</span>
                      <span>{masterResume.email}</span>
                      <span>•</span>
                      <span>{masterResume.phone}</span>
                      <span>•</span>
                      <a href={masterResume.linkedin} className="text-blue-600 hover:underline">LinkedIn</a>
                      <span>•</span>
                      <a href={masterResume.github} className="text-blue-600 hover:underline">GitHub</a>
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                      Professional Summary
                    </h2>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Results-driven Senior Software Engineer tailored specifically for <strong className="font-semibold text-slate-900">{application.company}</strong>&apos;s {application.position} role. 6+ years architecting high-scale frontend systems, real-time sync platforms, and accessible design systems. Proven experience slashing client p95 latency by 120ms and driving developer velocity across high-volume engineering teams.
                    </p>
                  </div>

                  {/* Key Skills */}
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                      Technical Competencies & Match
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-800">Target Match:</span> React 19, Next.js, TypeScript, Tailwind CSS, Turbopack
                      </div>
                      <div>
                        <span className="font-bold text-slate-800">Data & APIs:</span> Node.js, WebSockets, Redis, RESTful & GraphQL, PostgreSQL
                      </div>
                      <div>
                        <span className="font-bold text-slate-800">Engineering Rigor:</span> Playwright, Jest, CI/CD GitHub Actions, Web Vitals, WCAG AA
                      </div>
                      <div>
                        <span className="font-bold text-slate-800">Methodology:</span> Design Systems, Mentorship, Performance Profiling
                      </div>
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">
                      Experience
                    </h2>
                    <div className="space-y-4">
                      {masterResume.experience.map(exp => (
                        <div key={exp.id}>
                          <div className="flex items-baseline justify-between text-xs">
                            <span className="font-bold text-slate-900">{exp.role} <span className="font-normal text-slate-600">at {exp.company}</span></span>
                            <span className="text-[11px] text-slate-500 font-medium">{exp.period} | {exp.location}</span>
                          </div>
                          <ul className="mt-1.5 list-disc list-inside space-y-1 text-xs text-slate-700 leading-relaxed">
                            {exp.bullets.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education */}
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-1.5">
                      Education
                    </h2>
                    <div className="flex items-center justify-between text-xs text-slate-700">
                      <span className="font-bold text-slate-800">B.S. in Computer Science</span>
                      <span>University of Colorado Boulder • 2018</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Cover Letter Layout */
                <div className="max-w-2xl mx-auto space-y-5 text-xs text-slate-800 leading-relaxed">
                  <div className="border-b border-slate-200 pb-3">
                    <div className="font-bold text-slate-900 text-sm">{masterResume.fullName}</div>
                    <div className="text-[11px] text-slate-500">{masterResume.email} • {masterResume.phone}</div>
                  </div>

                  <div className="whitespace-pre-line font-sans text-xs text-slate-700 leading-relaxed">
                    {generatedCoverLetter || currentContent}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
