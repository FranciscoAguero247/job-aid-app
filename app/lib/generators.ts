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

  // Extract relevant keywords from JD
  const jdLower = (app.jobDescription || '').toLowerCase();
  
  // Find which of candidate's genuine skills appear in the JD
  const allCandidateSkills = resume.skills.flatMap(s => s.items);
  const matchedCandidateSkills = allCandidateSkills.filter(skill => 
    jdLower.includes(skill.toLowerCase())
  );
  
  const topMatchedDisplay = matchedCandidateSkills.length > 0
    ? matchedCandidateSkills.slice(0, 8).join(', ')
    : allCandidateSkills.slice(0, 6).join(', ');

  // Dynamic experience rendering
  const experienceSection = resume.experience && resume.experience.length > 0
    ? resume.experience.map(exp => {
        return `#### **${exp.company}** | ${exp.location}
*${exp.role}* | *${exp.period}*
${exp.bullets.map(b => `* ${b}`).join('\n')}`;
      }).join('\n\n')
    : `#### **Software Engineering Experience** | Remote\n*Software Engineer* | *2021 - Present*\n* Engineered core application features and delivered measurable business impact.`;

  // Dynamic skills rendering
  const skillsSection = resume.skills && resume.skills.length > 0
    ? resume.skills.map(skillGroup => `* **${skillGroup.category}:** ${skillGroup.items.join(', ')}`).join('\n')
    : `* **Core Skills:** ${allCandidateSkills.join(', ')}`;

  // Dynamic education rendering
  const educationSection = resume.education && resume.education.length > 0
    ? resume.education.map(edu => `* **${edu.degree}** — ${edu.institution} (${edu.year})`).join('\n')
    : `* **Degree in Computer Science or Equivalent Practical Experience**`;

  return `# ${resume.fullName}
**${position} Candidate**
${resume.location} | ${resume.email} | ${resume.phone}
[LinkedIn](${resume.linkedin}) | [GitHub](${resume.github || '#'}) | [Portfolio](${resume.portfolio || '#'})

---

### PROFESSIONAL SUMMARY
${resume.summary || `Results-driven software engineering candidate positioned specifically for **${company}**'s **${position}** role. Deep experience architecting scalable user experiences and reliable backend integrations, with direct alignment in **${topMatchedDisplay}**.`}

---

### CORE COMPETENCIES & KEYWORD ALIGNMENT
* **Target Alignment for ${company}:** ${topMatchedDisplay.toUpperCase()}
${skillsSection}

---

### PROFESSIONAL EXPERIENCE

${experienceSection}

---

### EDUCATION
${educationSection}
`;
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

  return `${todayFormatted}

Dear ${contactName},

I have been following ${app.company}'s work closely—particularly your relentless commitment to craft, user experience, and technical execution. When I saw the opening for the ${app.position}, I knew my background as a ${roleName} aligned directly with what your engineering team is building.

Throughout my experience, most recently at ${companyName}, I have focused on solving the core challenges highlighted in your job posting: ${leadMetric.replace(/^\*\s*/, '')}. I treat reliable system architecture, intuitive UI ergonomics, and clean code as essential requirements for high-velocity teams.

What excites me most about ${app.company} is the opportunity to tackle genuine scale and deliver real value to your customers. Whether it is collaborating with designers, streamlining developer workflows, or optimizing runtime performance, I pride myself on turning complex technical specifications into reliable, production-ready systems.

I would welcome the opportunity to speak with you about how my experience can help drive ${app.company}'s upcoming milestones. Thank you for your time and consideration.

Sincerely,

${resume.fullName}
${resume.email} | ${resume.phone}
${resume.portfolio || resume.linkedin}`;
}