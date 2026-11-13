import { JobApplication, MasterResume } from '../types';

export const SAMPLE_MASTER_RESUME: MasterResume = {
  fullName: "Alex Rivera",
  email: "alex.rivera@example.com",
  phone: "(555) 234-5678",
  location: "San Francisco, CA (Open to Remote)",
  linkedin: "https://linkedin.com/in/alexrivera-dev",
  github: "https://github.com/alexrivera",
  portfolio: "https://alexrivera.io",
  summary:
    "Product-focused Senior Software Engineer with 6+ years of experience architecting high-traffic web applications, design systems, and real-time collaborative interfaces. Proven track record scaling React/Next.js and Node.js platforms to millions of monthly active users while reducing load times by up to 45%. Passionate about intuitive UI/UX, developer velocity, and robust distributed systems.",
  experience: [
    {
      id: "exp-1",
      role: "Senior Software Engineer",
      company: "Apex Cloud Technologies",
      location: "San Francisco, CA",
      period: "2022 - Present",
      bullets: [
        "Architected and deployed a multi-tenant analytics dashboard in Next.js 15 and TypeScript, supporting 45,000+ daily active enterprise users.",
        "Refactored high-volume data tables with virtualized scrolling and WebSocket subscriptions, slashing memory footprint by 38% and latency by 120ms.",
        "Spearheaded adoption of end-to-end testing with Playwright and CI/CD automation via GitHub Actions, decreasing release regressions by 62%.",
        "Mentored 5 junior and mid-level engineers, leading weekly design reviews and pair-programming sessions on state management and performance."
      ]
    },
    {
      id: "exp-2",
      role: "Software Engineer",
      company: "Nexus Labs",
      location: "Austin, TX (Remote)",
      period: "2019 - 2022",
      bullets: [
        "Engineered core workflow automation features using React, Node.js, and PostgreSQL, accelerating customer onboarding completion by 24%.",
        "Built and maintained an accessible component design system (WCAG AA compliant) shared across 4 product teams, reducing frontend UI bugs by 35%.",
        "Designed and implemented RESTful and GraphQL APIs with Redis caching layers, scaling throughput to 3,200 req/sec at sub-50ms p95 latency."
      ]
    },
    {
      id: "exp-3",
      role: "Frontend Developer",
      company: "Catalyst Interactive",
      location: "Denver, CO",
      period: "2018 - 2019",
      bullets: [
        "Developed responsive client portals and landing experiences using modern JavaScript, HTML5, and Tailwind CSS.",
        "Collaborated closely with UX designers to translate complex Figma wireframes into pixel-perfect, accessible web interfaces."
      ]
    }
  ],
  skills: [
    {
      category: "Frontend",
      items: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Redux Toolkit", "Zustand", "HTML5/CSS3", "WebSockets"]
    },
    {
      category: "Backend & Systems",
      items: ["Node.js", "Express", "PostgreSQL", "Redis", "REST APIs", "GraphQL", "Prisma", "Docker"]
    },
    {
      category: "Testing & DevOps",
      items: ["Jest", "Playwright", "Git", "GitHub Actions", "Vercel", "AWS (S3, ECS)", "Turbopack"]
    }
  ],
  education: [
    {
      degree: "B.S. in Computer Science",
      institution: "University of Colorado Boulder",
      year: "2018"
    }
  ]
};

export const SAMPLE_APPLICATIONS: JobApplication[] = [
  {
    id: "app-1",
    company: "Stripe",
    position: "Senior Frontend Engineer - Developer Experience",
    location: "San Francisco, CA",
    workplaceType: "Hybrid",
    salary: "$195,000 - $240,000 + Equity",
    status: "Applied",
    appliedDate: "2026-11-03", // 7 days ago
    lastContactDate: "2026-11-03",
    jobUrl: "https://stripe.com/jobs/senior-frontend-devex",
    matchScore: 94,
    notes: "Applied via referral link. Reached out to Sarah on LinkedIn.",
    contact: {
      name: "Marcus Vance",
      title: "Engineering Manager - Developer Experience",
      company: "Stripe",
      email: "mvance@stripe.com",
      emailConfidence: 98,
      linkedinUrl: "https://www.linkedin.com/in/marcus-vance-eng",
      location: "San Francisco Bay Area",
      headline: "Engineering Manager @ Stripe | Building world-class developer tools",
      enrichedVia: "Manual"
    },
    jobDescription: `About the Role:
At Stripe, we are building economic infrastructure for the internet. As a Senior Frontend Engineer on the Developer Experience team, you will craft the tools, SDK interfaces, and dashboards that millions of developers worldwide use daily to integrate payments and financial services.

What you'll do:
- Design and build responsive, accessible web interfaces with React, TypeScript, and modern CSS architectures.
- Collaborate with product managers, designers, and API engineers to solve complex UX challenges in billing and financial dashboards.
- Improve developer productivity across our internal monorepo through tooling, test automation, and performance monitoring.
- Uphold our high bar for UI polish, latency optimization, and resilience under high transaction volumes.

Requirements:
- 5+ years of software engineering experience specializing in frontend web development.
- Deep expertise in TypeScript, React, state management, and modern browser APIs.
- Passion for developer experience, API usability, and meticulous attention to UI details.
- Strong cross-functional communication and experience mentoring team members.`
  },
  {
    id: "app-2",
    company: "Linear",
    position: "Product Engineer - Collaboration & Real-Time",
    location: "Remote (Global)",
    workplaceType: "Remote",
    salary: "$180,000 - $220,000 + 0.15% Equity",
    status: "Recruiter Screen",
    appliedDate: "2026-10-26", // 15 days ago
    lastContactDate: "2026-11-04", // 6 days ago (post screen)
    jobUrl: "https://linear.app/careers/product-engineer",
    matchScore: 91,
    notes: "Completed initial screen with recruiter Emma. Need to follow up on technical interview schedule.",
    contact: {
      name: "Tuomas Artman",
      title: "Co-Founder & Head of Engineering",
      company: "Linear",
      email: "tuomas@linear.app",
      emailConfidence: 94,
      linkedinUrl: "https://www.linkedin.com/in/artman",
      location: "San Francisco, CA",
      headline: "Co-Founder at Linear. Speed is the feature.",
      enrichedVia: "Manual"
    },
    jobDescription: `About Linear:
Linear is a purpose-built tool for modern software teams to manage projects, issues, and product roadmaps. We obsess over speed, fluidity, and craft.

About the Role:
We are looking for a Product Engineer to lead initiatives around real-time sync, collaborative editing, and keyboard-first user interfaces.

What you'll bring:
- Proven experience shipping polished consumer or B2B SaaS products with TypeScript and React.
- Understanding of local-first architectures, optimistic UI updates, and synchronization protocols (WebSockets, CRDTs).
- High sense of design aesthetics, micro-interactions, and 60fps animation performance.
- Independent, product-minded engineering approach where you define problems as well as write code.`
  },
  {
    id: "app-3",
    company: "Figma",
    position: "Senior Full Stack Engineer - Design Systems",
    location: "San Francisco, CA / New York, NY",
    workplaceType: "Hybrid",
    salary: "$210,000 - $255,000",
    status: "Technical Interview",
    appliedDate: "2026-10-18",
    lastContactDate: "2026-11-08", // 2 days ago
    jobUrl: "https://figma.com/careers/senior-fullstack-design-systems",
    matchScore: 89,
    notes: "System design round went great! Follow-up thank you email needed.",
    contact: {
      name: "Elena Rostova",
      title: "Staff Design Technologist & Hiring Lead",
      company: "Figma",
      email: "erostova@figma.com",
      emailConfidence: 96,
      linkedinUrl: "https://www.linkedin.com/in/elena-rostova-figma",
      location: "New York, NY",
      headline: "Bridging code & design at Figma. Ex-Airbnb.",
      enrichedVia: "Manual"
    },
    jobDescription: `At Figma, we believe that design should be collaborative, accessible, and fast.

The Design Systems team creates the foundational components, token architectures, and code connect tools that unite designers and engineers across organizations.

Key Responsibilities:
- Build and evolve component systems and code connectors linking design tokens to React/TypeScript codebases.
- Partner with product designers and frontend engineers to establish best-in-class accessibility and ergonomic APIs.
- Scale our server infrastructure and caching layers to handle complex enterprise component libraries.`
  },
  {
    id: "app-4",
    company: "Datadog",
    position: "Senior Software Engineer - Web Platform",
    location: "New York, NY",
    workplaceType: "Hybrid",
    salary: "$185,000 - $230,000",
    status: "Bookmarked",
    appliedDate: "2026-11-09",
    lastContactDate: "2026-11-09",
    jobUrl: "https://careers.datadoghq.com/detail/12345",
    matchScore: 87,
    notes: "Found open role. Preparing tailored resume and outreach to Datadog university alumni.",
    contact: {
      name: "David Chen",
      title: "Senior Technical Recruiter",
      company: "Datadog",
      email: "david.chen@datadoghq.com",
      emailConfidence: 92,
      linkedinUrl: "https://www.linkedin.com/in/david-chen-talent",
      location: "New York, NY",
      headline: "Technical Recruiter @ Datadog | Hiring Infrastructure & Platform Engineers",
      enrichedVia: "Manual"
    },
    jobDescription: `Datadog is the monitoring and security platform for cloud applications.

The Web Platform team builds the foundational libraries, micro-frontend infrastructure, and build systems that power Datadog's 100+ product surfaces.

Qualifications:
- 5+ years of software engineering experience.
- Deep understanding of JavaScript/TypeScript, webpack/Turbopack, and frontend architecture at scale.
- Experience with telemetry, performance profiling, and web vitals optimization.`
  }
];
