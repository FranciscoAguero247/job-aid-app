'use client';

import React, { useState } from 'react';
import { JobApplication, ApplicationStatus } from '../types';

interface SheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: JobApplication[];
  selectedAppId: string;
  onSelectApp: (app: JobApplication) => void;
  onAddApplication: (newApp: Partial<JobApplication>) => void;
  onSyncSheet: () => void;
  onEnrichApp: (appId: string) => void;
  isSyncing: boolean;
}

export default function SheetModal({
  isOpen,
  onClose,
  applications,
  selectedAppId,
  onSelectApp,
  onAddApplication,
  onSyncSheet,
  onEnrichApp,
  isSyncing,
}: SheetModalProps) {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newLocation, setNewLocation] = useState('Remote');
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('Applied');
  const [newSalary, setNewSalary] = useState('');

  if (!isOpen) return null;

  const filteredApps = filterStatus === 'All'
    ? applications
    : applications.filter(a => a.status === filterStatus);

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newPosition.trim()) return;

    onAddApplication({
      company: newCompany.trim(),
      position: newPosition.trim(),
      location: newLocation,
      status: newStatus,
      salary: newSalary.trim() || undefined,
      appliedDate: new Date().toISOString().split('T')[0],
      lastContactDate: new Date().toISOString().split('T')[0],
      jobDescription: `Target role: ${newPosition} at ${newCompany}. Add detailed qualifications and responsibilities here to generate tailored applications.`,
      matchScore: 90
    });

    setNewCompany('');
    setNewPosition('');
    setNewSalary('');
    setShowAddForm(false);
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Offer':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Technical Interview':
      case 'Final Round':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Recruiter Screen':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Applied':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              📊
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Live Application Tracker Sheet</h3>
              <p className="text-xs text-slate-500">Live sync with Google Sheets & Apollo contact discovery</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSyncSheet}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold text-emerald-800 transition"
            >
              <svg className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isSyncing ? 'Syncing...' : 'Sync with Google Sheet'}
            </button>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <span>+ Add Application</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Close sheet modal"
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Quick Add Form Drawer */}
        {showAddForm && (
          <form onSubmit={handleAddNew} className="p-4 my-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Company (e.g. OpenAI)"
              value={newCompany}
              onChange={e => setNewCompany(e.target.value)}
              required
              className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
            />
            <input
              type="text"
              placeholder="Position (e.g. Staff Engineer)"
              value={newPosition}
              onChange={e => setNewPosition(e.target.value)}
              required
              className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
            />
            <input
              type="text"
              placeholder="Location (e.g. Remote)"
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
            />
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value as ApplicationStatus)}
              className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
            >
              <option value="Applied">Applied</option>
              <option value="Recruiter Screen">Recruiter Screen</option>
              <option value="Technical Interview">Technical Interview</option>
              <option value="Final Round">Final Round</option>
              <option value="Offer">Offer</option>
              <option value="Bookmarked">Bookmarked</option>
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Salary ($180k)"
                value={newSalary}
                onChange={e => setNewSalary(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white flex-1"
              />
              <button
                type="submit"
                className="px-3 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 py-3 overflow-x-auto text-xs font-medium border-b border-slate-100">
          <span className="text-slate-400 font-semibold mr-1">Filter:</span>
          {['All', 'Applied', 'Recruiter Screen', 'Technical Interview', 'Offer', 'Bookmarked'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-full transition ${
                filterStatus === status
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Applications Table */}
        <div className="flex-1 overflow-y-auto mt-2 -mx-2 sm:mx-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3">Company & Role</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Applied</th>
                <th className="py-2.5 px-3">Apollo Enriched Contact</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.map((app) => {
                const isSelected = app.id === selectedAppId;
                const contact = app.contact;

                return (
                  <tr
                    key={app.id}
                    className={`hover:bg-blue-50/60 transition ${
                      isSelected ? 'bg-blue-50/90 font-medium' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{app.company}</div>
                          <div className="text-slate-500">{app.position} • <span className="text-slate-400">{app.location}</span></div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(app.status)}`}>
                        {app.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                      {app.appliedDate}
                    </td>

                    <td className="py-3 px-3">
                      {contact ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                            {contact.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{contact.name}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{contact.title}</div>
                          </div>
                          {contact.linkedinUrl && (
                            <a
                              href={contact.linkedinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline text-[11px] ml-1"
                              title="Open LinkedIn"
                            >
                              in ↗
                            </a>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => onEnrichApp(app.id)}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                        >
                          <span>⚡ Enrich Contact</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          onSelectApp(app);
                          onClose();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Total Applications: {applications.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
