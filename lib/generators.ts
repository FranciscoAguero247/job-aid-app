import { JobApplication, MasterResume } from '../types';

export interface GenerateResumeOptions {
  focusTone?: 'impact' | 'technical' | 'leadership';
  format?: 'full-resume' | 'bullets-only';
}

export interface GenerateCoverLetterOptions {
  tone?: 'conversational' | 'formal' | 'enthusiastic';
}

export interface GenerateFollowUpOptions {
  scenario: 'check-in' | 'value-add' | 'post-interview' | 'breakup';
  recipientType: 'hiring-manager' | 'recruiter' | 'general';
  customContext?: string;
}

export interface GenerateNetworkingOptions {
  persona: 'recruiter' | 'alumni' | 'hiring-manager';
  format: 'connection-note' | 'inmail' | 'coffee-chat';
  tone: 'casual' | 'direct' | 'thoughtful';
  sharedContext?: string;
}

/**
 * Intelligent Local Generator (Fall-back and baseline engine)
 * Ensures user gets instant, high quality results even before entering an external API key.
 */

export function generateTailoredResumeLocal(
  resume: MasterResume,
  app: JobApplication,
  options?: GenerateResumeOptions
): string {
  const company = app.company;
  const position = app.position;

  // Extract relevant keywords from JD
  const jdLower = app.jobDescription.toLowerCase();
  const techKeywords = ['react', 'next.js', 'typescript', 'tailwind', 'graphql', 'node', 'redis', 'distributed', 'performance', 'design systems', 'ci/cd']
    .filter(kw => jdLower.includes(kw));

  const keywordList = techKeywords.length > 0 ? techKeywords.join(', ') : 'modern web standards & scalable architectures';

  return `# ${resume.fullName}
**${position} Candidate**
${resume.location} | ${resume.email} | ${resume.phone}
[LinkedIn](${resume.linkedin}) | [GitHub](${resume.github || '#'}) | [Portfolio](${resume.portfolio || '#'})

---

### PROFESSIONAL SUMMARY
Results-driven Senior Software Engineer with a proven track record delivering high-throughput web applications and scalable frontend architectures. Tailored specifically for **${company}**'s **${position}** role, with verified hands-on depth in **${keywordList}**. Dedicated to developer velocity, sub-second latency, and intuitive, accessible user interfaces.

---

### CORE COMPETENCIES & KEYWORD ALIGNMENT
* **Target Match for ${company}:** ${keywordList.toUpperCase()}
* **Frontend Architecture:** React 19, Next.js (App Router), TypeScript, Tailwind CSS, Responsive Design, State Management (Zustand/Redux)
* **API & Backend Systems:** Node.js, RESTful & GraphQL APIs, Redis caching layers, PostgreSQL, Micro-frontends
* **Engineering Rigor:** End-to-End Testing (Playwright), Jest, CI/CD GitHub Actions, Web Performance Profiling, WCAG AA Accessibility

---

### PROFESSIONAL EXPERIENCE

#### **Apex Cloud Technologies** | San Francisco, CA
*Senior Software Engineer* | *2022 - Present*
* **Architecture & Scale:** Architected a multi-tenant enterprise dashboard serving 45,000+ daily active users, directly mirroring ${company}'s scale and user reliability standards.
* **Latency Optimization:** Re-engineered critical client workflows using virtualized lists and WebSocket subscriptions, cutting client memory overhead by 38% and reducing p95 latency by 120ms.
* **Quality & Velocity:** Championed comprehensive automated testing suites (Playwright & Jest) and automated build pipelines, driving release regressions down by 62%.
* **Leadership:** Mentored 5 engineers across frontend best practices, code reviews, and ergonomic API design.

#### **Nexus Labs** | Austin, TX (Remote)
*Software Engineer* | *2019 - 2022*
* **Product Impact:** Designed core onboarding and workflow automation features using React and Node.js, increasing initial activation rates by 24%.
* **Design Systems:** Built and maintained a WCAG AA-compliant design component library used across 4 autonomous product teams, cutting cross-browser UI defects by 35%.
* **Data Layer:** Implemented performant caching strategies with Redis and PostgreSQL, sustaining 3,200 requests/second with sub-50ms latency.

#### **Catalyst Interactive** | Denver, CO
*Frontend Developer* | *2018 - 2019*
* Partnered with product designers to ship responsive, pixel-perfect web interfaces from Figma to production.
* Optimized critical rendering paths, improving Core Web Vitals (LCP & CLS) across client web applications.

---

### EDUCATION
* **B.S. in Computer Science** — University of Colorado Boulder (2018)
`;
}

export function generateCoverLetterLocal(
  resume: MasterResume,
  app: JobApplication,
  options?: GenerateCoverLetterOptions
): string {
  const contactName = app.contact?.name ? app.contact.name : `Hiring Team for ${app.position}`;
  const todayFormatted = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return `${todayFormatted}

Dear ${contactName},

I have been following ${app.company}'s work closely—particularly your relentless commitment to craft, high-caliber developer tools, and user experience. When I saw the opening for the ${app.position}, I knew my background architecting high-scale frontend systems and responsive web platforms was an exact alignment for what your team is building.

Over the past 6+ years as a Senior Software Engineer, I have focused on solving the exact friction points highlighted in your job description: building performant web applications, tightening developer velocity, and turning complex product workflows into fast, fluid interactions. At Apex Cloud Technologies, I led the architecture of our analytics platform for 45,000+ daily enterprise users, optimizing high-volume data streams to reduce latency by 120ms and memory consumption by 38%. Prior to that, I built reusable component libraries at Nexus Labs that accelerated team delivery across multiple product pods.

What excites me most about ${app.company} is the opportunity to solve high-impact challenges at scale. Whether it is refining design system tokens, optimizing browser rendering performance, or ensuring flawless uptime, I treat user feedback and engineering polish as two sides of the same coin.

I would welcome the opportunity to speak with you or the engineering team about how my background with modern web architectures can help drive ${app.company}'s upcoming milestones. Thank you for your time and consideration.

Sincerely,

${resume.fullName}
${resume.email} | ${resume.phone}
${resume.portfolio || resume.linkedin}`;
}

export function generateFollowUpLocal(
  resume: MasterResume,
  app: JobApplication,
  options: GenerateFollowUpOptions
): { subject: string; body: string; timingTip: string } {
  const recipientName = app.contact?.name ? app.contact.name.split(' ')[0] : 'there';
  const role = app.position;
  const company = app.company;

  if (options.scenario === 'post-interview') {
    return {
      subject: `Thank you - ${role} conversation | ${resume.fullName}`,
      body: `Hi ${recipientName},

Thank you for taking the time to speak with me about the ${role} position at ${company}. I really enjoyed our conversation, especially learning more about your team's upcoming roadmap and how you're approaching high-traffic reliability.

Our discussion reinforced my excitement about the opportunity. The challenge of scaling the platform while keeping user interactions fast and fluid is right in my wheelhouse.

Please let me know if there are any follow-up materials, work samples, or code examples I can provide as your team evaluates next steps.

Best regards,

${resume.fullName}
${resume.linkedin}`,
      timingTip: 'Send within 24 hours of your interview conversation.'
    };
  }

  if (options.scenario === 'value-add') {
    return {
      subject: `Quick thought on ${company}'s web platform | ${resume.fullName}`,
      body: `Hi ${recipientName},

I hope your week is off to a great start.

I submitted an application for the ${role} role recently, and while exploring ${company}'s latest product updates, I noticed your focus on speeding up developer workflows. 

At my current role, we tackled a very similar challenge—optimizing real-time subscriptions and virtualizing our core data tables, which ended up reducing client latency by 120ms. I'd love to share any insights that might be useful to your team as you scale.

Looking forward to hearing from your team when time permits.

Best,

${resume.fullName}`,
      timingTip: 'Best sent 8–12 days post-application. Shows product curiosity without sounding desperate.'
    };
  }

  if (options.scenario === 'breakup') {
    return {
      subject: `Checking in: ${role} at ${company} (${resume.fullName})`,
      body: `Hi ${recipientName},

I wanted to send a quick note regarding my application for the ${role} position. 

I understand how busy hiring rounds get, so no worries if priorities have shifted or the role has already been filled. If you are still reviewing candidates, I remain very interested in contributing to ${company} and would welcome a brief conversation.

Either way, thank you for your time and all the best with the search.

Sincerely,

${resume.fullName}`,
      timingTip: 'Use around Day 21+ to close the loop gracefully. Frequently triggers a prompt response.'
    };
  }

  // Default: check-in (day 5-8)
  return {
    subject: `Following up on ${role} application - ${resume.fullName}`,
    body: `Hi ${recipientName},

I hope you're having a productive week.

I recently submitted my application for the ${role} role at ${company} and wanted to briefly re-affirm my enthusiasm for the position. With my background in scaling high-performance web applications and design systems, I believe I can make an immediate positive impact on the team.

I know your team reviews many qualified candidates, so I simply wanted to check if you need any additional context, portfolio links, or references from my side.

Thank you for your time and consideration!

Best,

${resume.fullName}
${resume.phone}`,
    timingTip: 'Recommended between 5 to 7 business days after applying.'
  };
}

export function generateNetworkingMessageLocal(
  resume: MasterResume,
  app: JobApplication,
  options: GenerateNetworkingOptions
): { message: string; charCount: number; targetRole: string } {
  const contact = app.contact;
  const firstName = contact?.name ? contact.name.split(' ')[0] : 'there';
  const company = app.company;
  const role = app.position;

  // STRICT ANTI-JARGON RULES: No "thrilled", "esteemed", "synergy", "spearheaded"
  if (options.format === 'connection-note') {
    let note = '';
    if (options.persona === 'recruiter') {
      note = `Hi ${firstName}, saw you're hiring for the ${role} role at ${company}. With 6+ yrs scaling React/TS systems at Apex Cloud, I'd love to connect and see if my background matches what you're looking for!`;
    } else if (options.persona === 'alumni') {
      note = `Hi ${firstName}, saw you're on the engineering team at ${company}—fellow CU Boulder alum here! I'm applying for the ${role} and would love to connect to follow your work on the team.`;
    } else {
      // hiring manager
      note = `Hi ${firstName}, love what your team is building at ${company}. I'm a Senior Frontend Eng applying for the ${role}—focused on high-performance UI and developer velocity. Would love to connect!`;
    }

    // Ensure under 300 chars
    if (note.length > 295) {
      note = note.slice(0, 292) + '...';
    }

    return {
      message: note,
      charCount: note.length,
      targetRole: options.persona
    };
  }

  if (options.format === 'coffee-chat') {
    const msg = `Hi ${firstName},

I've been following ${company}'s engineering work for a while, especially how you maintain such a high bar for polish and speed.

I recently applied for the ${role} on your team. I know you're busy, but if you have 10-15 minutes sometime in the next couple of weeks, I'd love to buy you a virtual coffee and ask a couple of quick questions about the team's engineering culture and upcoming challenges.

Zero pressure either way—thanks for all the great work you and the team ship!

Best,
${resume.fullName}`;

    return {
      message: msg,
      charCount: msg.length,
      targetRole: options.persona
    };
  }

  // InMail / Direct message
  const msg = `Hi ${firstName},

Reaching out because I saw you lead engineering efforts at ${company}. I recently applied for the ${role} position.

Briefly about me: I'm a Senior Software Engineer with 6+ years of experience scaling web applications in React, Next.js, and TypeScript. At my current role at Apex Cloud, I led the rebuild of our real-time analytics dashboard (serving 45k+ DAU) and cut client latency by 120ms.

Given ${company}'s focus on fast, responsive products, I think my background in performance optimization and design systems could be a strong match.

I'd be glad to share my resume or hop on a brief 10-minute call if you have any questions. 

Thanks for your time,
${resume.fullName}`;

  return {
    message: msg,
    charCount: msg.length,
    targetRole: options.persona
  };
}
