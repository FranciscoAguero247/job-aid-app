'use client';

import React, { useState } from 'react';
import { MasterResume } from '../types';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterResume: MasterResume;
  onSaveResume: (resume: MasterResume) => void;
  apiKey?: string;
}

export default function ResumeModal({
  isOpen,
  onClose,
  masterResume,
  onSaveResume,
  apiKey,
}: ResumeModalProps) {
  const [resumeData, setResumeData] = useState<MasterResume>(masterResume);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'edit'>('upload');

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadStatus(`Processing ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (apiKey) formData.append('apiKey', apiKey);

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.resume) {
        setResumeData(data.resume);
        onSaveResume(data.resume);
        setUploadStatus(`✓ Successfully extracted and saved resume: ${data.resume.fullName}`);
        setActiveTab('edit');
      } else {
        setUploadStatus(`Error: ${data.error || 'Could not parse file'}`);
      }
    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAndClose = () => {
    onSaveResume(resumeData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
              📄
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Master Candidate Resume</h3>
              <p className="text-xs text-slate-500">Your core background, skills, and experience for AI tailoring</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 pt-4 pb-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Upload Resume (PDF / TXT / JSON)
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'edit'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Review & Edit Profile
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 text-center bg-slate-50/60 hover:bg-blue-50/30 transition cursor-pointer"
              >
                <input
                  type="file"
                  id="modal-resume-file"
                  accept=".pdf,.txt,.json,.md"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <label htmlFor="modal-resume-file" className="cursor-pointer block">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 text-xl">
                    ⬆️
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {isUploading ? 'Extracting Resume...' : 'Drag & drop your resume here, or browse'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports PDF, Text (.txt, .md), and JSON.
                  </p>
                  <p className="text-[11px] text-blue-600 font-medium mt-3">
                    Multimodal PDF extraction preserves two-column layouts and visual hierarchy.
                  </p>
                </label>
              </div>

              {uploadStatus && (
                <div className={`p-3 rounded-xl text-xs font-medium ${
                  uploadStatus.startsWith('✓')
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : uploadStatus.startsWith('Error')
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200 animate-pulse'
                }`}>
                  {uploadStatus}
                </div>
              )}

              {/* Current Active Resume Summary */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Currently Active Resume</span>
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Active</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{resumeData.fullName}</h4>
                <p className="text-xs text-slate-600 mt-0.5">{resumeData.location} • {resumeData.email}</p>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{resumeData.summary}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={resumeData.fullName}
                    onChange={(e) => setResumeData({ ...resumeData, fullName: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={resumeData.email}
                    onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={resumeData.phone}
                    onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Location</label>
                  <input
                    type="text"
                    value={resumeData.location}
                    onChange={(e) => setResumeData({ ...resumeData, location: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Professional Summary</label>
                <textarea
                  rows={3}
                  value={resumeData.summary}
                  onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 leading-relaxed"
                />
              </div>

              {/* Skills */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Skills (comma-separated)</label>
                <input
                  type="text"
                  value={resumeData.skills.flatMap(s => s.items).join(', ')}
                  onChange={(e) => {
                    const items = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    setResumeData({
                      ...resumeData,
                      skills: [{ category: 'Core Skills', items }]
                    });
                  }}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                />
              </div>

              {/* Experience Highlights */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Work History ({resumeData.experience.length} roles)</label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                  {resumeData.experience.map((exp, idx) => (
                    <div key={exp.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{exp.role} @ {exp.company}</span>
                        <span className="text-slate-500 font-normal">{exp.period}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                        {exp.bullets[0] || 'Key engineering responsibilities'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="text-xs px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndClose}
            className="text-xs px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs"
          >
            Save Master Resume
          </button>
        </div>

      </div>
    </div>
  );
}
