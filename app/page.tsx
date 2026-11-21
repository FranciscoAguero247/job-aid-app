'use client';

import React, { useState } from 'react';
import ResumeModal from './components/ResumeModal';
import { MasterResume, TailoredResume } from './types';
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
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);
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
      if (data.success && data.resume) {
        setTailoredResume(data.resume as TailoredResume);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadResume = () => {
    if (!tailoredResume) return;
    downloadHtmlElementAsPdf('resume-preview', 'tailored-resume');
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
                    <header className="resume-preview-header">
                      <h4 className="resume-preview-name">
                        <input
                          value={tailoredResume.fullName}
                          onChange={(event) => setTailoredResume({ ...tailoredResume, fullName: event.target.value })}
                          className="resume-edit-input resume-edit-name"
                          aria-label="Full name"
                        />
                      </h4>
                      <div className="resume-preview-meta">
                        <input value={tailoredResume.location} onChange={(event) => setTailoredResume({ ...tailoredResume, location: event.target.value })} className="resume-edit-input" aria-label="Location" />
                        <input value={tailoredResume.email} onChange={(event) => setTailoredResume({ ...tailoredResume, email: event.target.value })} className="resume-edit-input" aria-label="Email" />
                        <input value={tailoredResume.phone} onChange={(event) => setTailoredResume({ ...tailoredResume, phone: event.target.value })} className="resume-edit-input" aria-label="Phone" />
                      </div>
                    </header>

                    <div className="resume-preview-body">
                      <section className="resume-preview-section">
                        <h5 className="resume-preview-section-title">Professional Summary</h5>
                        <textarea
                          value={tailoredResume.summary}
                          onChange={(event) => setTailoredResume({ ...tailoredResume, summary: event.target.value })}
                          className="resume-edit-textarea resume-summary-edit"
                          aria-label="Professional summary"
                        />
                      </section>

                      <section className="resume-preview-section">
                        <h5 className="resume-preview-section-title">Core Skills</h5>
                        {tailoredResume.skills.map((skill, groupIndex) => (
                          <div key={`${skill.category}-${groupIndex}`} className="resume-skill-group">
                            <strong>{skill.category}:</strong>{' '}
                            <textarea
                              value={skill.items.join(', ')}
                              onChange={(event) => {
                                const items = event.target.value.split(',').map((item) => item.trim()).filter(Boolean);
                                setTailoredResume({
                                  ...tailoredResume,
                                  skills: tailoredResume.skills.map((current, index) => index === groupIndex ? { ...current, items } : current),
                                });
                              }}
                              className="resume-edit-textarea resume-inline-edit"
                              aria-label={`${skill.category} skills`}
                            />
                          </div>
                        ))}
                      </section>

                      <section className="resume-preview-section">
                        <h5 className="resume-preview-section-title">Experience</h5>
                        {tailoredResume.experience.map((exp, expIndex) => (
                          <div key={exp.id} className="resume-entry">
                            <div className="resume-entry-heading">
                              <input value={exp.role} onChange={(event) => {
                                const experience = tailoredResume.experience.map((current, index) => index === expIndex ? { ...current, role: event.target.value } : current);
                                setTailoredResume({ ...tailoredResume, experience });
                              }} className="resume-edit-input resume-edit-role" aria-label="Role" />
                              <span className="resume-entry-divider">—</span>
                              <input value={exp.company} onChange={(event) => {
                                const experience = tailoredResume.experience.map((current, index) => index === expIndex ? { ...current, company: event.target.value } : current);
                                setTailoredResume({ ...tailoredResume, experience });
                              }} className="resume-edit-input" aria-label="Company" />
                              <input value={`${exp.location}${exp.location && exp.period ? ' | ' : ''}${exp.period}`} onChange={(event) => {
                                const [location = '', ...periodParts] = event.target.value.split('|').map((part) => part.trim());
                                const experience = tailoredResume.experience.map((current, index) => index === expIndex ? { ...current, location, period: periodParts.join('|').trim() } : current);
                                setTailoredResume({ ...tailoredResume, experience });
                              }} className="resume-edit-input resume-entry-meta" aria-label="Location and period" />
                            </div>
                            <ul className="resume-bullet-list">
                              {exp.bullets.map((bullet, bulletIndex) => (
                                <li key={bulletIndex}>
                                  <textarea
                                    value={bullet}
                                    onChange={(event) => {
                                      const experience = tailoredResume.experience.map((current, index) => index === expIndex
                                        ? { ...current, bullets: current.bullets.map((item, itemIndex) => itemIndex === bulletIndex ? event.target.value : item) }
                                        : current);
                                      setTailoredResume({ ...tailoredResume, experience });
                                    }}
                                    className="resume-edit-textarea resume-bullet-edit"
                                    aria-label="Experience bullet"
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </section>

                      {tailoredResume.projects.length > 0 && (
                        <section className="resume-preview-section">
                          <h5 className="resume-preview-section-title">Projects</h5>
                          {tailoredResume.projects.map((project) => (
                            <div key={project.id} className="resume-entry">
                              <strong>{project.name}</strong>
                              {project.description && <p>{project.description}</p>}
                              {project.technologies.length > 0 && <p className="resume-project-tech"><strong>Technologies:</strong> {project.technologies.join(', ')}</p>}
                            </div>
                          ))}
                        </section>
                      )}

                      {tailoredResume.education.length > 0 && (
                        <section className="resume-preview-section">
                          <h5 className="resume-preview-section-title">Education</h5>
                          {tailoredResume.education.map((education, index) => (
                            <div key={`${education.institution}-${index}`} className="resume-entry">
                              <strong>{education.degree}</strong>
                              {education.institution && <span> — {education.institution}</span>}
                              {education.year && <span> ({education.year})</span>}
                            </div>
                          ))}
                        </section>
                      )}
                    </div>
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