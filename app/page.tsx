'use client';

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SettingsModal from './components/SettingsModal';
import SheetModal from './components/SheetModal';
import ResumeModal from './components/ResumeModal';
import FastApplyWorkspace from './components/FastApplyWorkspace';
import TabResumeCoverLetter from './components/TabResumeCoverLetter';
import TabFollowUps from './components/TabFollowUps';
import TabNetworking from './components/TabNetworking';
import { SAMPLE_APPLICATIONS, SAMPLE_MASTER_RESUME } from './lib/sample-data';
import { JobApplication, MasterResume, AppSettings } from './types';

export default function Home() {
  const [applications, setApplications] = useState<JobApplication[]>(SAMPLE_APPLICATIONS);
  const [selectedAppId, setSelectedAppId] = useState<string>(SAMPLE_APPLICATIONS[0].id);
  const [masterResume, setMasterResume] = useState<MasterResume>(SAMPLE_MASTER_RESUME);
  const [activeTab, setActiveTab] = useState<'fast-apply' | 'pipeline' | 'followups' | 'networking'>('fast-apply');
  
  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // App settings state
  const [settings, setSettings] = useState<AppSettings>({
    geminiApiKey: '',
    apolloApiKey: '',
    googleSheetUrl: '',
  });

  // Load saved settings, master resume & applications from localStorage on client mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('job_aid_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
      const savedResume = localStorage.getItem('job_aid_master_resume');
      if (savedResume) {
        setMasterResume(JSON.parse(savedResume));
      }
      const savedApps = localStorage.getItem('job_aid_applications');
      if (savedApps) {
        const parsed = JSON.parse(savedApps);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setApplications(parsed);
          setSelectedAppId(parsed[0].id);
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
  }, []);

  const saveApplications = (newApps: JobApplication[]) => {
    setApplications(newApps);
    try {
      localStorage.setItem('job_aid_applications', JSON.stringify(newApps));
    } catch (e) {
      console.warn('Could not save applications', e);
    }
  };

  const handleSaveResume = (newResume: MasterResume) => {
    setMasterResume(newResume);
    try {
      localStorage.setItem('job_aid_master_resume', JSON.stringify(newResume));
    } catch (e) {
      console.warn('Could not save master resume', e);
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('job_aid_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Could not save settings', e);
    }
  };

  const selectedApp = applications.find(a => a.id === selectedAppId) || applications[0];

  // Enrich contact with Apollo
  const handleEnrichApp = async (appId: string) => {
    const target = applications.find(a => a.id === appId);
    if (!target) return;

    setIsEnriching(true);
    try {
      const res = await fetch('/api/apollo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: target.company,
          position: target.position,
          apolloApiKey: settings.apolloApiKey,
        }),
      });

      const data = await res.json();
      if (data.success && data.contact) {
        const updated = applications.map(app => {
          if (app.id === appId) {
            return { ...app, contact: data.contact };
          }
          return app;
        });
        saveApplications(updated);
      }
    } catch (err) {
      console.error('Apollo enrichment failed:', err);
    } finally {
      setIsEnriching(false);
    }
  };

  // Sync with Google Sheets
  const handleSyncSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetUrl: settings.googleSheetUrl || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.applications) && data.applications.length > 0) {
        saveApplications(data.applications);
        setSelectedAppId(data.applications[0].id);
      }
    } catch (err) {
      console.error('Sheet sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Add new application manually / from fast apply
  const handleAddApplication = (newApp: Partial<JobApplication>) => {
    const fullApp: JobApplication = {
      id: `app-${Date.now()}`,
      company: newApp.company || 'New Company',
      position: newApp.position || 'Software Engineer',
      location: newApp.location || 'Remote',
      workplaceType: newApp.workplaceType || 'Remote',
      salary: newApp.salary,
      status: newApp.status || 'Applied',
      appliedDate: newApp.appliedDate || new Date().toISOString().split('T')[0],
      lastContactDate: newApp.appliedDate || new Date().toISOString().split('T')[0],
      jobDescription: newApp.jobDescription || 'Add requirements and description here...',
      jobUrl: newApp.jobUrl,
      matchScore: newApp.matchScore || 90,
    };

    const updated = [fullApp, ...applications];
    saveApplications(updated);
    setSelectedAppId(fullApp.id);
  };

  // Update target job description for an application
  const handleUpdateJobDescription = (newJd: string) => {
    const updated = applications.map(app => {
      if (app.id === selectedAppId) {
        return { ...app, jobDescription: newJd };
      }
      return app;
    });
    saveApplications(updated);
  };

  // Update last contact date (e.g. after sending a follow-up)
  const handleUpdateContactDate = (appId: string, newDate: string) => {
    const updated = applications.map(app => {
      if (app.id === appId) {
        return { ...app, lastContactDate: newDate };
      }
      return app;
    });
    saveApplications(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Application Header */}
      <Header
        applications={applications}
        selectedApp={selectedApp}
        onSelectApp={(app) => setSelectedAppId(app.id)}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        onOpenResumeModal={() => setIsResumeModalOpen(true)}
        onEnrichCurrentApp={() => handleEnrichApp(selectedApp.id)}
        isEnriching={isEnriching}
        settings={settings}
        masterResume={masterResume}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'fast-apply' && (
          <FastApplyWorkspace
            masterResume={masterResume}
            onUpdateMasterResume={handleSaveResume}
            onSaveApplicationToTracker={handleAddApplication}
            onOpenResumeModal={() => setIsResumeModalOpen(true)}
            settings={settings}
          />
        )}

        {activeTab === 'pipeline' && (
          <TabResumeCoverLetter
            application={selectedApp}
            masterResume={masterResume}
            onUpdateJobDescription={handleUpdateJobDescription}
            apiKey={settings.geminiApiKey}
          />
        )}

        {activeTab === 'followups' && (
          <TabFollowUps
            application={selectedApp}
            masterResume={masterResume}
            onUpdateAppContactDate={handleUpdateContactDate}
            apiKey={settings.geminiApiKey}
          />
        )}

        {activeTab === 'networking' && (
          <TabNetworking
            application={selectedApp}
            masterResume={masterResume}
            apiKey={settings.geminiApiKey}
          />
        )}
      </main>

      {/* Master Resume Upload & Review Modal */}
      <ResumeModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        masterResume={masterResume}
        onSaveResume={handleSaveResume}
        apiKey={settings.geminiApiKey}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Sheet Manager Modal */}
      <SheetModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        applications={applications}
        selectedAppId={selectedAppId}
        onSelectApp={(app) => setSelectedAppId(app.id)}
        onAddApplication={handleAddApplication}
        onSyncSheet={handleSyncSheet}
        onEnrichApp={handleEnrichApp}
        isSyncing={isSyncing}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400 no-print">
        JobAid • AI Job Hunting Command Center • Truth-Anchored Tailoring • Fast Plug & Play Application Kits
      </footer>

    </div>
  );
}
