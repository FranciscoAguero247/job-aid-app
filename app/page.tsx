'use client';

import React, { useState } from 'react';
import ResumeModal from './components/ResumeModal';
import { MasterResume } from './types';
import Header from './components/Header';
import { downloadTextAsPdf } from './lib/PDF-export';

const DEFAULT_RESUME: MasterResume = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  portfolio: '',
  summary: '',
  experience: [],
  skills: [],
  education: [],
  projects: [],
};

export default function Home() {
  const [resume, setResume] = useState<MasterResume>(DEFAULT_RESUME);
  const [jobDescription, setJobDescription] = useState('');
  const [tailoredResume, setTailoredResume] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!resume.fullName || !jobDescription.trim()) return;

    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resume',
          resume,
          application: {
            id: 'job-1',
            company: 'Target Company',
            position: 'Target Role',
            location: 'Remote',
            workplaceType: 'Remote',
            status: 'Applied',
            appliedDate: new Date().toISOString().split('T')[0],
            lastContactDate: new Date().toISOString().split('T')[0],
            jobDescription,
          },
          options: {},
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTailoredResume(data.result);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCoverLetter = async () => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cover-letter',
        resume,
        application: {
          id: 'job-1',
          company: 'Target Company',
          position: 'Target Role',
          location: 'Remote',
          workplaceType: 'Remote',
          status: 'Applied',
          appliedDate: new Date().toISOString().split('T')[0],
          lastContactDate: new Date().toISOString().split('T')[0],
          jobDescription,
        },
      }),
    });

    const data = await res.json();
    if (data.success) {
      setCoverLetter(data.result);
    }
  };

  const handleDownloadResume = () => {
    if (!tailoredResume) return;
    downloadTextAsPdf('tailored-resume', tailoredResume);
  };

  const handleDownloadCoverLetter = () => {
    if (!coverLetter) return;
    downloadTextAsPdf('cover-letter', coverLetter);
  };

  return (
    <>
    <Header />
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-[320px_1fr_1.2fr]">
        <aside className="bg-white rounded-2xl border p-4">
          <button
            onClick={() => setIsResumeModalOpen(true)}
            className="w-full rounded-xl bg-blue-600 text-white px-4 py-3 font-semibold"
          >
            Upload Resume PDF
          </button>

          <div className="mt-4">
            <h3 className="font-bold">{resume.fullName || 'No resume loaded'}</h3>
            <p className="text-sm text-slate-500">{resume.email || 'No contact details yet'}</p>
          </div>
        </aside>

        <section className="bg-white rounded-2xl border p-4">
          <h2 className="font-bold text-lg mb-3">Job Description</h2>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full h-[420px] rounded-xl border p-3"
            placeholder="Paste job description or URL text here..." />
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleGenerate}
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Tailored Resume'}
            </button>

            <button
              onClick={handleCoverLetter}
              className="bg-slate-900 text-white px-4 py-2 rounded-xl"
            >
              Generate Cover Letter
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl border p-4">
          <h2 className="font-bold text-lg mb-3">Generated Output</h2>

          {tailoredResume && (
            <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-800">Tailored Resume</h3>
                <button
                  onClick={handleDownloadResume}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Download PDF
                </button>
              </div>
              <textarea
                value={tailoredResume}
                onChange={(e) => setTailoredResume(e.target.value)}
                className="min-h-[260px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          {coverLetter && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-800">Cover Letter</h3>
                <button
                  onClick={handleDownloadCoverLetter}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Download PDF
                </button>
              </div>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="min-h-[220px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}
        </section>
      </div>

      <ResumeModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        masterResume={resume}
        onSaveResume={setResume}
        apiKey="" />
    </main></>
  );
}