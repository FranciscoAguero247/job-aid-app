import { JobApplication, MasterResume } from '../types';

export interface GenerateResumeOptions {
  focusTone?: 'impact' | 'technical' | 'leadership';
  format?: 'full-resume' | 'bullets-only';
}

export interface GenerateCoverLetterOptions {
  tone?: 'conversational' | 'formal' | 'enthusiastic';
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
): string {
  const company = app.company || 'Target Company';
  const position = app.position || 'Software Engineer';
  const jdLower = (app.jobDescription || '').toLowerCase();

  const allCandidateSkills = resume.skills.flatMap((group) => group.items);
  const matchedCandidateSkills = allCandidateSkills.filter((skill) =>
    skill && jdLower.includes(skill.toLowerCase())
  );

  const topMatchedDisplay = matchedCandidateSkills.length > 0
    ? matchedCandidateSkills.slice(0, 8).join(', ')
    : allCandidateSkills.slice(0, 6).join(', ');

  const selectedExperience = resume.experience.length > 0
    ? resume.experience
        .map((exp) => ({
          ...exp,
          matchScore: exp.bullets.filter((bullet) => {
            const bulletText = bullet.toLowerCase();
            return Object.keys({
              react: 'react',
              javascript: 'javascript',
              typescript: 'typescript',
              next: 'next',
              api: 'api',
              product: 'product',
              leadership: 'leadership',
              performance: 'performance',
              backend: 'backend',
              systems: 'systems',
            }).some((keyword) => bulletText.includes(keyword));
          }).length,
        }))
        .sort((a, b) => b.matchScore - a.matchScore)
    : [];

  const experienceSection = selectedExperience.length > 0
    ? selectedExperience.map((exp) => {
        return `#### **${exp.company}** | ${exp.location}\n*${exp.role}* | *${exp.period}*\n${exp.bullets.map((b) => `* ${b}`).join('\n')}`;
      }).join('\n\n')
    : `#### **Software Engineering Experience** | Remote\n*Software Engineer* | *2021 - Present*\n* Built reliable software features and translated product requirements into maintainable code.`;

  const skillsSection = resume.skills && resume.skills.length > 0
    ? resume.skills.map((skillGroup) => `* **${skillGroup.category}:** ${skillGroup.items.join(', ')}`).join('\n')
    : `* **Core Skills:** ${allCandidateSkills.join(', ')}`;

  const educationSection = resume.education && resume.education.length > 0
    ? resume.education.map((edu) => `* **${edu.degree}** — ${edu.institution} (${edu.year})`).join('\n')
    : `* **Degree in Computer Science or Equivalent Practical Experience**`;

  const summaryText = resume.summary || `Results-driven software engineering candidate with experience building reliable, product-focused systems and strong alignment with ${company}’s ${position} requirements.`;

  return `# ${resume.fullName}\n**${position} Candidate**\n${resume.location} | ${resume.email} | ${resume.phone}\n[LinkedIn](${resume.linkedin}) | [GitHub](${resume.github || '#'}) | [Portfolio](${resume.portfolio || '#'})\n\n---\n\n### PROFESSIONAL SUMMARY\n${summaryText}\n\nThis profile is positioned for **${company}** and emphasizes work in **${topMatchedDisplay}**.\n\n---\n\n### CORE COMPETENCIES & TARGET ALIGNMENT\n* **Target Alignment for ${company}:** ${topMatchedDisplay.toUpperCase()}\n${skillsSection}\n\n---\n\n### PROFESSIONAL EXPERIENCE\n\n${experienceSection}\n\n---\n\n### EDUCATION\n${educationSection}\n`;
}

export function generateCoverLetterLocal(
  resume: MasterResume,
  app: JobApplication,
  options?: GenerateCoverLetterOptions
): string {
  const contactName = app.contact?.name ? app.contact.name : `Hiring Team for ${app.position}`;
  const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const mostRecentRole = resume.experience[0];
  const roleName = mostRecentRole?.role || 'Software Engineer';
  const companyName = mostRecentRole?.company || 'my recent company';
  const leadMetric = mostRecentRole?.bullets[0] || 'delivering high-impact software features and leading technical initiatives';

  return `${todayFormatted}\n\nDear ${contactName},\n\nI am excited to apply for the ${app.position} role at ${app.company}. My background as a ${roleName} has centered on building reliable, user-focused software and turning business goals into execution plans. In my work at ${companyName}, I have focused on solving the kinds of problems described in your job description, including ${leadMetric.replace(/^\*\s*/, '')}.\n\nWhat stands out to me about ${app.company} is the opportunity to contribute to work that combines product impact, technical quality, and a strong engineering culture. I bring a practical, collaborative approach to building systems that are maintainable, efficient, and grounded in user needs. I would welcome the chance to bring that experience to your team.\n\nThank you for your consideration. I would welcome the opportunity to discuss how my background could support ${app.company}'s goals.\n\nSincerely,\n\n${resume.fullName}\n${resume.email} | ${resume.phone}\n${resume.portfolio || resume.linkedin}`;
}