'use client';

import React, { useState, useEffect } from 'react';
import { JobApplication, MasterResume, AppSettings, CareerAdvice } from '../types';

interface FastApplyWorkspaceProps {
  masterResume: MasterResume;
  onUpdateMasterResume: (resume: MasterResume) => void;
  onSaveApplicationToTracker: (app: JobApplication) => void;
  onOpenResumeModal: () => void;
  settings: AppSettings;
}

export default function FastApplyWorkspace({
  masterResume,
  onUpdateMasterResume,
  onSaveApplicationToTracker,
  onOpenResumeModal,
  settings,
}: FastApplyWorkspaceProps) {
  // --- INPUT STATES ---
  const [jobInputType, setJobInputType] = useState<'url' | 'paste'>('paste');
  const [jobUrl, setJobUrl] = useState('');
  const [jobDescription, setJobDescription] = useState(
    `We are looking for a Senior Software Engineer to build scalable web applications.
Requirements:
- 5+ years with React, Next.js, and TypeScript
- Strong understanding of web performance, REST/GraphQL APIs, and Tailwind CSS
- Experience architecting reliable distributed services and collaborating with product teams.`
  );
  const [company, setCompany] = useState('Acme Corp');
  const [position, setPosition] = useState('Senior Software Engineer');
  const [includeCoverLetter, setIncludeCoverLetter] = useState(true);
  const [tone, setTone] = useState<'impact' | 'technical' | 'leadership'>('impact');
  const [customPrompt, setCustomPrompt] = useState('');

  // --- PROCESSING STATES ---
  const [isExtractingJob, setIsExtractingJob] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // --- OUTPUT KIT STATES ---
  const [activeOutputTab, setActiveOutputTab] = useState<'resume' | 'cover-letter' | 'outreach' | 'advice'>('resume');
  const [tailoredResume, setTailoredResume] = useState<string>('');
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [outreachMessage, setOutreachMessage] = useState<{ message: string; charCount: number }>({
    message: '',
    charCount: 0,
  });
  const [careerAdvice, setCareerAdvice] = useState<CareerAdvice | null>(null);
  
  // Edit mode toggle
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [isEditingCoverLetter, setIsEditingCoverLetter] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedToTracker, setSavedToTracker] = useState(false);
  const [aiTweakInput, setAiTweakInput] = useState('');

  // Generate initial draft on mount if not yet generated
  useEffect(() => {
    if (!tailoredResume) {
      handleGenerateAll();
    }
  }, []);

  // Quick copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Dedicated PDF Print/Download
  const handleDownloadPDF = () => {
    window.print();
  };

  // Extract job details from URL
  const handleExtractJobUrl = async () => {
    if (!jobUrl.trim()) return;
    setIsExtractingJob(true);
    setStatusMessage('Fetching and analyzing job details...');
    try {
      const res = await fetch('/api/extract-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl, apiKey: settings.geminiApiKey }),
      });
      const data = await res.json();
      if (data.success && data.job) {
        if (data.job.company) setCompany(data.job.company);
        if (data.job.position) setPosition(data.job.position);
        if (data.job.jobDescription) setJobDescription(data.job.jobDescription);
        setStatusMessage(`✓ Extracted job for ${data.job.company}`);
      } else {
        setStatusMessage('Could not extract automatically. Please paste the job description below.');
      }
    } catch (err: any) {
      setStatusMessage(`Error fetching URL: ${err.message}`);
    } finally {
      setIsExtractingJob(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Quick resume file upload from left column
  const handleQuickResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingResume(true);
    setStatusMessage(`Parsing ${file.name}...`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (settings.geminiApiKey) formData.append('apiKey', settings.geminiApiKey);

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.resume) {
        onUpdateMasterResume(data.resume);
        setStatusMessage(`✓ Loaded resume for ${data.resume.fullName}`);
      } else {
        setStatusMessage(`Resume error: ${data.error || 'Failed to parse'}`);
      }
    } catch (err: any) {
      setStatusMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsUploadingResume(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Primary action: Generate Application Kit
  const handleGenerateAll = async (customInstruction?: string) => {
    setIsGenerating(true);
    setSavedToTracker(false);
    setStatusMessage('Synthesizing tailored application kit...');

    const targetApp: JobApplication = {
      id: `app-${Date.now()}`,
      company: company || 'Target Company',
      position: position || 'Software Engineer',
      location: 'Remote',
      workplaceType: 'Remote',
      status: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
      lastContactDate: new Date().toISOString().split('T')[0],
      jobDescription,
      jobUrl: jobUrl || undefined,
    };

    try {
      // 1. Generate Tailored Resume
      const resumePromise = fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resume',
          resume: masterResume,
          application: targetApp,
          options: { focusTone: tone, customInstruction: customInstruction || customPrompt },
          apiKey: settings.geminiApiKey,
        }),
      }).then(r => r.json());

      // 2. Generate Cover Letter (if checked)
      const coverPromise = includeCoverLetter
        ? fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'cover-letter',
              resume: masterResume,
              application: targetApp,
              options: { customInstruction: customInstruction || customPrompt },
              apiKey: settings.geminiApiKey,
            }),
          }).then(r => r.json())
        : Promise.resolve(null);

      // 3. Generate Recruiter Note
      const outreachPromise = fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'networking',
          resume: masterResume,
          application: targetApp,
          options: { format: 'connection-note', persona: 'recruiter' },
          apiKey: settings.geminiApiKey,
        }),
      }).then(r => r.json());

      // 4. Generate Career Advice
      const advicePromise = fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'career-advice',
          resume: masterResume,
          application: targetApp,
          apiKey: settings.geminiApiKey,
        }),
      }).then(r => r.json());

      const [resumeRes, coverRes, outreachRes, adviceRes] = await Promise.all([
        resumePromise,
        coverPromise,
        outreachPromise,
        advicePromise,
      ]);

      if (resumeRes?.success && resumeRes.result) {
        setTailoredResume(resumeRes.result);
      }
      if (coverRes?.success && coverRes.result) {
        setCoverLetter(coverRes.result);
      }
      if (outreachRes?.success && outreachRes.result) {
        if (typeof outreachRes.result === 'object') {
          setOutreachMessage({
            message: outreachRes.result.message || '',
            charCount: outreachRes.result.charCount || outreachRes.result.message?.length || 0,
          });
        } else {
          setOutreachMessage({ message: outreachRes.result, charCount: outreachRes.result.length });
        }
      }
      if (adviceRes?.success && adviceRes.result) {
        setCareerAdvice(adviceRes.result);
      }

      setStatusMessage('✓ Application Kit generated successfully!');
    } catch (err: any) {
      setStatusMessage(`Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Save current job to Tracker
  const handleSaveToTracker = () => {
    const newApp: JobApplication = {
      id: `app-${Date.now()}`,
      company: company || 'Target Company',
      position: position || 'Software Engineer',
      location: 'Remote',
      workplaceType: 'Remote',
      status: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
      lastContactDate: new Date().toISOString().split('T')[0],
      jobDescription,
      jobUrl: jobUrl || undefined,
      matchScore: careerAdvice?.matchScore || 90,
    };
    onSaveApplicationToTracker(newApp);
    setSavedToTracker(true);
    setTimeout(() => setSavedToTracker(false), 3000);
  };

  // Extract keywords to display in match chips
  const allCandidateSkills = masterResume.skills.flatMap(s => s.items);
  const matchedKeywords = allCandidateSkills.filter(s =>
    jobDescription.toLowerCase().includes(s.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
      
      {/* ======================================================== */}
      {/* LEFT COLUMN: Plug & Play Inputs (Resume, JD, Controls)   */}
      {/* ======================================================== */}
      <div className="lg:col-span-5 space-y-5 no-print">

        {/* 1. Resume Source Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-base">📄</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">1. Master Resume</h3>
            </div>
            <button
              onClick={onOpenResumeModal}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
            >
              Edit Profile ↗
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="truncate pr-2">
              <div className="font-bold text-xs text-slate-900 truncate">{masterResume.fullName}</div>
              <div className="text-[11px] text-slate-500 truncate">{masterResume.location} • {masterResume.skills.flatMap(s => s.items).length} skills listed</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="file"
                id="quick-resume-file"
                accept=".pdf,.txt,.json,.md"
                className="hidden"
                onChange={handleQuickResumeUpload}
              />
              <label
                htmlFor="quick-resume-file"
                className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition cursor-pointer shadow-2xs"
              >
                {isUploadingResume ? 'Uploading...' : 'Upload PDF'}
              </label>
            </div>
          </div>
        </div>

        {/* 2. Target Job Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">2. Target Job Post</h3>
            </div>
            
            {/* Toggle URL vs Paste */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setJobInputType('paste')}
                className={`px-2 py-1 rounded-md transition ${jobInputType === 'paste' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-500'}`}
              >
                Paste JD
              </button>
              <button
                onClick={() => setJobInputType('url')}
                className={`px-2 py-1 rounded-md transition ${jobInputType === 'url' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-500'}`}
              >
                Insert Link
              </button>
            </div>
          </div>

          {jobInputType === 'url' ? (
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Job Posting URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://linkedin.com/jobs/view/... or company page"
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-mono"
                />
                <button
                  onClick={handleExtractJobUrl}
                  disabled={isExtractingJob}
                  className="text-xs px-3.5 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition disabled:opacity-50"
                >
                  {isExtractingJob ? 'Fetching...' : 'Extract'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Fetches role details directly from public job pages.</p>
            </div>
          ) : null}

          {/* Company & Role Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Stripe, Acme Corp"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Job Title</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>

          {/* Job Description Textarea */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Job Description & Qualifications
            </label>
            <textarea
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the qualifications, requirements, and tech stack here..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-700 bg-slate-50/50 leading-relaxed"
            />
          </div>
        </div>

        {/* 3. Options & Customization Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="text-base">⚙️</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">3. Application Options</h3>
          </div>

          {/* Cover Letter Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100/70 transition">
            <input
              type="checkbox"
              checked={includeCoverLetter}
              onChange={(e) => setIncludeCoverLetter(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-800">Generate Custom Cover Letter (PDF)</span>
              <p className="text-[11px] text-slate-500">Uncheck if the job application does not require a cover letter.</p>
            </div>
          </label>

          {/* Tone Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Tailoring Tone</label>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {[
                { id: 'impact', label: 'Impact & Scale' },
                { id: 'technical', label: 'Technical Depth' },
                { id: 'leadership', label: 'Leadership' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setTone(item.id as any)}
                  className={`py-1.5 px-2 rounded-lg border font-medium transition ${
                    tone === item.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Instruction Tweak */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Custom AI Instructions (Optional)
            </label>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Emphasize Next.js & latency optimization, keep to 1 page"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => handleGenerateAll()}
            disabled={isGenerating}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <span className="text-base">{isGenerating ? '⏳' : '⚡'}</span>
            <span>{isGenerating ? 'Synthesizing Application Kit...' : 'Generate Tailored Application Kit'}</span>
          </button>

          {statusMessage && (
            <p className="text-[11px] text-center font-semibold text-slate-600 animate-fade-in">
              {statusMessage}
            </p>
          )}
        </div>

      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: Output Application Kit (Live Editor & PDF) */}
      {/* ======================================================== */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Navigation Tabs for Generated Assets */}
        <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveOutputTab('resume')}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                activeOutputTab === 'resume'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>📄</span>
              <span>Tailored Resume</span>
            </button>

            {includeCoverLetter && (
              <button
                onClick={() => setActiveOutputTab('cover-letter')}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  activeOutputTab === 'cover-letter'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>✉️</span>
                <span>Cover Letter</span>
              </button>
            )}

            <button
              onClick={() => setActiveOutputTab('outreach')}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                activeOutputTab === 'outreach'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>💬</span>
              <span>Recruiter Note</span>
            </button>

            <button
              onClick={() => setActiveOutputTab('advice')}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                activeOutputTab === 'advice'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>💡</span>
              <span>Career Advice</span>
              {careerAdvice?.matchScore && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded-md">
                  {careerAdvice.matchScore}%
                </span>
              )}
            </button>
          </div>

          {/* Save to Application Tracker Button */}
          <button
            onClick={handleSaveToTracker}
            className={`text-xs px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition ${
              savedToTracker
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Log this job into your pipeline tracker"
          >
            <span>{savedToTracker ? '✓' : '+'}</span>
            <span>{savedToTracker ? 'Saved to Tracker' : 'Save to Tracker'}</span>
          </button>
        </div>

        {/* -------------------------------------------------------- */}
        {/* TAB 1: TAILORED RESUME PREVIEW & LIVE EDIT               */}
        {/* -------------------------------------------------------- */}
        {activeOutputTab === 'resume' && (
          <div className="space-y-3">
            {/* Action Bar */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 no-print">
              {/* Keyword chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Matched:</span>
                {matchedKeywords.length > 0 ? (
                  matchedKeywords.slice(0, 4).map(kw => (
                    <span key={kw} className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                      ✓ {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400">Authentic profile skills</span>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setIsEditingResume(!isEditingResume)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition"
                >
                  {isEditingResume ? '👁️ Preview' : '✏️ Edit Text'}
                </button>

                <button
                  onClick={() => handleCopy(tailoredResume, 'resume')}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-1.5 transition"
                >
                  {copiedKey === 'resume' ? '✓ Copied' : '📋 Copy'}
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="text-xs px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition"
                >
                  <span>⬇️ Download PDF</span>
                </button>
              </div>
            </div>

            {/* Document Box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden pdf-export-content">
              {isEditingResume ? (
                <div className="p-4 no-print">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700">Live Resume Editor (Markdown)</span>
                    <span className="text-[11px] text-slate-400">Any tweak made here compiles into your PDF export</span>
                  </div>
                  <textarea
                    rows={26}
                    value={tailoredResume}
                    onChange={(e) => setTailoredResume(e.target.value)}
                    className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 leading-relaxed"
                  />
                </div>
              ) : (
                <div className="p-8 sm:p-10 font-sans text-slate-900 bg-white min-h-[600px] leading-relaxed">
                  <div className="border-b border-slate-300 pb-4 mb-5">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">{masterResume.fullName}</h1>
                    <div className="text-xs font-bold text-blue-700 uppercase tracking-wide mt-0.5">
                      {position} Candidate • {company} Alignment
                    </div>
                    <div className="text-xs text-slate-600 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>{masterResume.location}</span>
                      <span>•</span>
                      <span>{masterResume.email}</span>
                      <span>•</span>
                      <span>{masterResume.phone}</span>
                      {masterResume.linkedin && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">{masterResume.linkedin}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Render content cleanly formatted */}
                  <div className="text-xs text-slate-800 whitespace-pre-wrap font-sans space-y-4">
                    {tailoredResume}
                  </div>
                </div>
              )}
            </div>

            {/* Quick AI Tweak Bar */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex items-center gap-2 no-print">
              <span className="text-sm">✨</span>
              <input
                type="text"
                value={aiTweakInput}
                onChange={(e) => setAiTweakInput(e.target.value)}
                placeholder="Tweak resume (e.g. 'Make bullets punchier', 'Highlight React 19', 'Shorten summary')..."
                className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && aiTweakInput.trim()) {
                    handleGenerateAll(aiTweakInput);
                    setAiTweakInput('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (aiTweakInput.trim()) {
                    handleGenerateAll(aiTweakInput);
                    setAiTweakInput('');
                  }
                }}
                disabled={isGenerating || !aiTweakInput.trim()}
                className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition disabled:opacity-50"
              >
                Apply Tweak
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* TAB 2: COVER LETTER PREVIEW & LIVE EDIT                  */}
        {/* -------------------------------------------------------- */}
        {activeOutputTab === 'cover-letter' && includeCoverLetter && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex items-center justify-between gap-2 no-print">
              <span className="text-xs font-bold text-slate-700">Cover Letter for {company}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingCoverLetter(!isEditingCoverLetter)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition"
                >
                  {isEditingCoverLetter ? '👁️ Preview' : '✏️ Edit Text'}
                </button>
                <button
                  onClick={() => handleCopy(coverLetter, 'cover')}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition"
                >
                  {copiedKey === 'cover' ? '✓ Copied' : '📋 Copy'}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="text-xs px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition"
                >
                  <span>⬇️ Download PDF</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden pdf-export-content p-8 sm:p-10 font-sans text-xs text-slate-800 leading-relaxed min-h-[500px]">
              {isEditingCoverLetter ? (
                <textarea
                  rows={20}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full text-xs font-sans p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 leading-relaxed"
                />
              ) : (
                <div className="whitespace-pre-wrap space-y-4">
                  {coverLetter}
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* TAB 3: RECRUITER OUTREACH MESSAGE                        */}
        {/* -------------------------------------------------------- */}
        {activeOutputTab === 'outreach' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Direct Recruiter Outreach Message</h3>
                <p className="text-xs text-slate-500">Human, authentic tone without corporate buzzwords.</p>
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                {outreachMessage.charCount} / 295 chars
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
              {outreachMessage.message || 'Generating recruiter outreach message...'}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Ideal for LinkedIn connection requests, InMail, or quick email pings.
              </span>
              <button
                onClick={() => handleCopy(outreachMessage.message, 'outreach')}
                className="text-xs px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <span>{copiedKey === 'outreach' ? '✓' : '📋'}</span>
                <span>{copiedKey === 'outreach' ? 'Copied to Clipboard' : 'Copy Message'}</span>
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* TAB 4: PERSONAL CAREER COACH ADVICE                      */}
        {/* -------------------------------------------------------- */}
        {activeOutputTab === 'advice' && careerAdvice && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            {/* Top Score */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Personal Career Support & Strategic Alignment</h3>
                <p className="text-xs text-slate-500">Key strengths, talking points, and interview preparation for {company}.</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-600">{careerAdvice.matchScore}%</span>
                <span className="text-[10px] block text-slate-400 uppercase tracking-wider font-bold">Match Score</span>
              </div>
            </div>

            {/* Strengths */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center gap-1.5">
                <span>✓</span>
                <span>Your Core Competitive Advantages for this Role</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {careerAdvice.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Gaps to Address */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Gaps to Address or Reframe during Interviews</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {careerAdvice.gapsToAddress.map((gap, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Questions to Ask Interviewer */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 mb-2 flex items-center gap-1.5">
                <span>💬</span>
                <span>High-Leverage Questions to Ask Your Interviewer</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {careerAdvice.questionsToAsk.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
                    <span className="text-blue-600 font-bold">Q:</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
