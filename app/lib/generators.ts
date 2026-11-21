import { JobApplication, MasterResume, TailoredResume } from '../types';

export interface GenerateResumeOptions {
  focusTone?: 'impact' | 'technical' | 'leadership';
  format?: 'full-resume' | 'bullets-only';
  customInstruction?: string;
}

/**
 * Intelligent Local Generator (Fall-back and baseline engine)
 * Ensures user gets instant, high quality results even before entering an external API key.
 * Strictly anchored to candidate's real data (No hallucinated employers or skills).
 */

export function generateTailoredResumeLocal(
  resume: MasterResume,
  app: JobApplication,
  options?: GenerateResumeOptions
): TailoredResume {
  const company = app.company || '';
  const position = app.position || '';
  const jdLower = (app.jobDescription || '').toLowerCase();

  const allCandidateSkills = resume.skills.flatMap((group) => group.items);
  const matchedSkills = allCandidateSkills.filter((skill) =>
    skill && jdLower.includes(skill.toLowerCase())
  );

  const experience = [...resume.experience]
    .sort((a, b) => {
      const aMatches = a.bullets.filter((bullet) => jdLower.includes(bullet.toLowerCase())).length;
      const bMatches = b.bullets.filter((bullet) => jdLower.includes(bullet.toLowerCase())).length;
      return bMatches - aMatches;
    });

  const summary = resume.summary
    ? resume.summary
    : `Results-driven ${position || 'professional'} candidate with experience aligned to ${company || 'the target role'}.`;

  return {
    fullName: resume.fullName,
    email: resume.email,
    phone: resume.phone,
    location: resume.location,
    linkedin: resume.linkedin,
    github: resume.github,
    portfolio: resume.portfolio,
    summary,
    skills: resume.skills.length > 0
      ? resume.skills.map((group) => ({
          category: group.category,
          items: matchedSkills.length > 0
            ? [...new Set([...matchedSkills, ...group.items])].slice(0, 12)
            : group.items,
        }))
      : [{ category: 'Core Skills', items: allCandidateSkills.slice(0, 12) }],
    experience,
    projects: resume.projects.map((project, index) => ({
      id: project.id || `project-${index + 1}`,
      name: project.name,
      description: project.description,
      technologies: project.technologies,
      link: project.link || '',
      githubLink: project.githubLink || '',
      bullets: project.bullets || [],
    })),
    education: resume.education,
  };
}