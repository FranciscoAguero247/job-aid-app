'use client';

import React, { useState } from 'react';
import ResumeModal from './components/ResumeModal';
import { MasterResume } from './types';
import Header from './components/Header';
import { downloadHtmlElementAsPdf } from './lib/PDF-export';

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

// Helper to dynamically extract job metadata from job description text
function extractJobMetadata(jobText: string) {
  const lines = jobText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  // Default fallbacks (omitted or empty rather than hardcoded "Target Company")
  let company = '';
  let position = '';
  let location = '';

  if (lines.length > 0) {
    // Often the first or second line contains the Role Title or Company
    const firstLine = lines[0];
    if (firstLine.length < 60 && !firstLine.toLowerCase().includes('about')) {
      position = firstLine;
    }
    
    // Look for patterns like "at Company Name" or "Company: X"
    for (const line of lines.slice(0, 10)) {
      const atMatch = line.match(/(?:at|company:)\s+([A-Z0-9][a-zA-Z0-9\s&,.-]{1,30})/i);
      if (atMatch && atMatch[1] && !company) {
        company = atMatch[1].trim();
      }
      const locMatch = line.match(/(?:location:|based in|remote|hybrid)\s+([A-Z][a-zA-Z\s,.-]{2,30})/i);
      if (locMatch && !location) {
        location = locMatch[0].trim();
      }
    }
  }

  return {
    company,
    position,
    location,
    requirements: lines.filter(l => l.match(/requirement|qualif|must have|experience with/i)),
    responsibilities: lines.filter(l => l.match(/responsibilit|duties|you will|will work/i)),
  };
}

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
    const metadata = extractJobMetadata(jobDescription);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resume',
          resume,
          application: {
            id: 'job-1',
            company: metadata.company || '',
            position: metadata.position || 'Software Engineer',
            location: metadata.location || 'Remote',
            workplaceType: 'Remote',
            status: 'Applied',
            appliedDate: new Date().toISOString().split('T')[0],
            lastContactDate: new Date().toISOString().split('T')[0],
            jobDescription,
            requirements: metadata.requirements,
            responsibilities: metadata.responsibilities,
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
    if (!jobDescription.trim()) return;
    const metadata = extractJobMetadata(jobDescription);

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cover-letter',
        resume,
        application: {
          id: 'job-1',
          company: metadata.company || '', // Omitted if empty rather than faked
          position: metadata.position || '', // Omitted if empty rather than faked
          location: metadata.location || '',
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
    downloadHtmlElementAsPdf('resume-preview', 'tailored-resume');
  };

  const handleDownloadCoverLetter = () => {
    if (!coverLetter) return;
    downloadHtmlElementAsPdf('cover-letter-preview', 'cover-letter');
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl grid gap-6 lg:grid-cols-[320px_1fr_1.2fr]">
          <aside className="bg-white rounded-2xl border p-4 shadow-sm">
            <button
              onClick={() => setIsResumeModalOpen(true)}
              className="w-full rounded-xl bg-blue-600 text-white px-4 py-3 font-semibold hover:bg-blue-700 transition"
            >
              Upload Resume PDF
            </button>

            <div className="mt-4">
              <h3 className="font-bold">{resume.fullName || 'No resume loaded'}</h3>
              <p className="text-sm text-slate-500">{resume.email || 'No contact details yet'}</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsResumeModalOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Review & Edit Profile →
              </button>
            </div>
          </aside>

          <section className="bg-white rounded-2xl border p-4 shadow-sm">
            <h2 className="font-bold text-lg mb-3">Job Description</h2>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full h-[420px] rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Paste job description or URL text here..." 
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleGenerate}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition"
                disabled={isGenerating}
              >
                {isGenerating ? 'Generating...' : 'Generate Tailored Resume'}
              </button>

              <button
                onClick={handleCoverLetter}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition"
              >
                Generate Cover Letter
              </button>
            </div>
          </section>

          <section className="bg-white rounded-2xl border p-4 shadow-sm">
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
                <div className="resume-preview-wrapper">
                  <div id="resume-preview" className="resume-preview">
                    <div className="resume-preview-header">
                      <h4 className="resume-preview-name">{resume.fullName || 'Candidate Name'}</h4>
                      <div className="resume-preview-meta">
                        <span>{resume.location}</span>
                        <span>{resume.email}</span>
                        <span>{resume.phone}</span>
                      </div>
                    </div>
                    <div className="resume-preview-body">
                      <textarea
                        value={tailoredResume}
                        onChange={(e) => setTailoredResume(e.target.value)}
                        className="min-h-[260px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
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
                <div className="resume-preview-wrapper">
                  <div id="cover-letter-preview" className="resume-preview cover-letter-preview">
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      className="min-h-[220px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <ResumeModal
          isOpen={isResumeModalOpen}
          onClose={() => setIsResumeModalOpen(false)}
          masterResume={resume}
          onSaveResume={setResume}
          apiKey="" 
        />
      </main>
    </>
  );
}