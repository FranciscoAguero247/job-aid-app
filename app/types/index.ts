export type ApplicationStatus = 
  | 'Bookmarked'
  | 'Applied'
  | 'Recruiter Screen'
  | 'Technical Interview'
  | 'Final Round'
  | 'Offer'
  | 'Rejected'
  | 'Archived';

export interface EnrichedContact {
  name: string;
  title: string;
  company: string;
  email?: string;
  emailConfidence?: number;
  linkedinUrl?: string;
  location?: string;
  photoUrl?: string;
  headline?: string;
  enrichedVia: 'Apollo' | 'Manual' | 'Mock';
}

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  location: string;
  workplaceType: 'Remote' | 'Hybrid' | 'On-site';
  salary?: string;
  status: ApplicationStatus;
  appliedDate: string; // YYYY-MM-DD
  lastContactDate: string; // YYYY-MM-DD
  jobUrl?: string;
  jobDescription: string;
  notes?: string;
  contact?: EnrichedContact;
  matchScore?: number;
}

export interface MasterResume {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github?: string;
  portfolio?: string;
  summary: string;
  experience: {
    id: string;
    role: string;
    company: string;
    location: string;
    period: string;
    bullets: string[];
  }[];
  skills: {
    category: string;
    items: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
}

export interface AppSettings {
  geminiApiKey: string;
  apolloApiKey: string;
  googleSheetUrl: string;
  lastSynced?: string;
}
