import { NextRequest, NextResponse } from 'next/server';
import { MasterResume } from '@/app/types';

async function extractPdfTextFromBuffer(buffer: Buffer): Promise<string> {
  let parser: any | null = null;

  try {
    const { PDFParse } = await import('pdf-parse');
    parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    console.log('Extracted PDF text:', result.text);
    return result.text?.trim() || '';
  } catch (error) {
    console.warn('Local PDF extraction failed:', error);
    return '';
  } finally {
    if (parser) {
      await parser.destroy().catch(() => undefined);
    }
  }
}

function buildConservativeFallbackResume(rawText: string, fileName: string): MasterResume | null {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const normalizedText = lines.join(' ');
  if (!normalizedText || normalizedText.length < 20) {
    return null;
  }

  // Conservative contact extraction
  const emailMatch = normalizedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = normalizedText.match(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = normalizedText.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);
  const githubMatch = normalizedText.match(/github\.com\/([a-zA-Z0-9_-]+)/);
  const portfolioMatch = normalizedText.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/i);

  const fileBaseName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const candidateNameLine = lines.slice(0, 3).find((line) => {
    return line.length < 40 && /^[A-Z][A-Za-z\s]{2,38}$/.test(line);
  }) || fileBaseName;

  // Section Boundary Detectors
  const sectionKeywords = /^(summary|professional summary|profile|experience|work experience|employment|skills|core competencies|education|projects)/i;
  let currentSection = 'header';
  const sections: Record<string, string[]> = {
    summary: [],
    experience: [],
    skills: [],
    education: [],
    projects: [],
  };

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (sectionKeywords.test(line) && line.length < 30) {
      if (lower.includes('summary') || lower.includes('profile')) currentSection = 'summary';
      else if (lower.includes('experience') || lower.includes('employment')) currentSection = 'experience';
      else if (lower.includes('skill') || lower.includes('competencies')) currentSection = 'skills';
      else if (lower.includes('education')) currentSection = 'education';
      else if (lower.includes('project')) currentSection = 'projects';
      continue;
    }
    if (sections[currentSection]) {
      sections[currentSection].push(line);
    }
  }

  const summaryText = sections.summary.join(' ').trim();
  const summary = summaryText.length > 20 ? summaryText : '';

  // Conservative skill extraction only from skill sections
  const knownTechKeywords = new Set([
    'react', 'next.js', 'typescript', 'javascript', 'python', 'node.js', 'tailwind',
    'css', 'html', 'sql', 'git', 'docker', 'aws', 'graphql', 'rest', 'api', 'vue',
    'angular', 'java', 'c++', 'ruby', 'mongodb', 'postgresql', 'linux', 'agile'
  ]);

  const extractedSkills: string[] = [];
  if (sections.skills.length > 0) {
    for (const line of sections.skills) {
      const tokens = line.split(/[,•|/–\s]+/);
      for (const token of tokens) {
        const cleanToken = token.replace(/[^a-zA-Z0-9+#.]/g, '').trim();
        if (cleanToken.length > 1 && (knownTechKeywords.has(cleanToken.toLowerCase()) || cleanToken[0] === cleanToken[0].toUpperCase())) {
          if (!extractedSkills.includes(cleanToken)) {
            extractedSkills.push(cleanToken);
          }
        }
      }
    }
  }

  // Do not invent false experience or education if unparseable
  const experienceList = sections.experience.length > 0 ? [{
    id: 'exp-1',
    role: sections.experience[0] || 'Professional Role',
    company: '',
    location: '',
    period: '',
    bullets: sections.experience.slice(1, 6),
  }] : [];

  const educationList = sections.education.length > 0 ? [{
    degree: sections.education.join(' '),
    institution: '',
    year: '',
  }] : [];

  return {
    fullName: candidateNameLine.trim(),
    email: emailMatch?.[0] || '',
    phone: phoneMatch?.[0] || '',
    location: '',
    linkedin: linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : '',
    github: githubMatch ? `https://github.com/${githubMatch[1]}` : '',
    portfolio: portfolioMatch ? portfolioMatch[0] : '',
    summary,
    experience: experienceList,
    projects: [],
    skills: extractedSkills.length > 0 ? [{ category: 'Extracted Skills', items: extractedSkills.slice(0, 15) }] : [],
    education: educationList,
  };
}

function parseGeminiResumePayload(rawText: string): MasterResume | null {
  try {
    const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned) as Partial<MasterResume>;

    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.fullName || !Array.isArray(parsed.experience)) return null;

    return normalizeMasterResume(parsed);
  } catch {
    return null;
  }
}

function normalizeMasterResume(parsed: Partial<MasterResume>): MasterResume {
  return {
    fullName: typeof parsed.fullName === 'string' ? parsed.fullName : '',
    email: typeof parsed.email === 'string' ? parsed.email : '',
    phone: typeof parsed.phone === 'string' ? parsed.phone : '',
    location: typeof parsed.location === 'string' ? parsed.location : '',
    linkedin: typeof parsed.linkedin === 'string' ? parsed.linkedin : '',
    github: typeof parsed.github === 'string' ? parsed.github : '',
    portfolio: typeof parsed.portfolio === 'string' ? parsed.portfolio : '',
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    experience: Array.isArray(parsed.experience) ? parsed.experience.map((exp, index) => ({
      id: exp?.id || `exp-${index + 1}`,
      role: exp?.role || '',
      company: exp?.company || '',
      location: exp?.location || '',
      period: exp?.period || '',
      bullets: Array.isArray(exp?.bullets) ? exp.bullets.filter((bullet) => typeof bullet === 'string') : [],
    })) : [],
    projects: Array.isArray(parsed.projects) ? parsed.projects.map((proj, index) => ({
      id: proj?.id || `proj-${index + 1}`,
      name: proj?.name || '',
      description: proj?.description || '',
      technologies: Array.isArray(proj?.technologies) ? proj.technologies : [],
      link: proj?.link || '',
      githubLink: proj?.githubLink || '',
      bullets: Array.isArray(proj?.bullets) ? proj.bullets : [],
    })) : [],
    skills: Array.isArray(parsed.skills) ? parsed.skills.map((group, index) => ({
      category: group?.category || `Skill Group ${index + 1}`,
      items: Array.isArray(group?.items) ? group.items : [],
    })) : [],
    education: Array.isArray(parsed.education) ? parsed.education.map((edu) => ({
      degree: edu?.degree || '',
      institution: edu?.institution || '',
      year: edu?.year || '',
    })) : [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const apiKey = (formData.get('apiKey') as string) || process.env.GEMINI_API_KEY;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const isPdf = filename.endsWith('.pdf') || file.type === 'application/pdf';
    const isJson = filename.endsWith('.json') || file.type === 'application/json';

    let rawText = '';
    let base64Pdf = '';

    if (isPdf) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      base64Pdf = buffer.toString('base64');
      rawText = await extractPdfTextFromBuffer(buffer);
    } else {
      rawText = await file.text();
      if (isJson) {
        try {
          const parsedJson = JSON.parse(rawText);
          if (parsedJson.fullName && parsedJson.experience) {
            const normalizedResume = normalizeMasterResume(parsedJson as Partial<MasterResume>);
            return NextResponse.json({ success: true, resume: normalizedResume, source: 'json-direct' });
          }
        } catch {
          // Fall through
        }
      }
    }

    // Use Gemini for PDFs/text when API key is available
    if (apiKey) {
      try {
        const strictExtractionPrompt = `You are an elite, highly accurate resume data extraction engine.
TASK: Extract the candidate's resume precisely into valid JSON matching this TypeScript schema:

{
  "fullName": string,
  "email": string,
  "phone": string,
  "location": string,
  "linkedin": string,
  "github": string,
  "portfolio": string,
  "summary": string,
  "experience": [
    {
      "id": string,
      "role": string,
      "company": string,
      "location": string,
      "period": string,
      "bullets": string[]
    }
  ],
  "skills": [
    {
      "category": string,
      "items": string[]
    }
  ],
  "projects": [
    {
      "id": string,
      "name": string,
      "description": string,
      "technologies": string[],
      "link": string,
      "githubLink": string,
      "bullets": string[]
    }
  ],
  "education": [
    {
      "degree": string,
      "institution": string,
      "year": string
    }
  ]
}

STRICT EXTRACTION RULES:
1. Preserve employment history precisely with real dates, roles, and companies.
2. Preserve achievement bullet text and metrics accurately without altering numbers.
3. Extract skills ONLY from designated skills sections or genuine technical context. Omit unknown or unmentioned fields.
4. Output ONLY valid parseable JSON without markdown code fences, comments, or extra text.`;

        const parts: any[] = [];
        if (isPdf && base64Pdf) {
          parts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Pdf,
            },
          });
          parts.push({
            text: `${strictExtractionPrompt}\n\nParse the attached PDF resume into the JSON schema.`,
          });
        } else {
          parts.push({
            text: `${strictExtractionPrompt}\n\nCANDIDATE RESUME TEXT:\n${rawText}`,
          });
        }

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts }],
              generationConfig: {
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const geminiParts = geminiData?.candidates?.flatMap((candidate: any) => candidate?.content?.parts ?? []) ?? [];
          const jsonText = geminiParts
            .map((part: any) => typeof part?.text === 'string' ? part.text : '')
            .join('\n');

          const parsed = parseGeminiResumePayload(jsonText);
          if (parsed) {
            return NextResponse.json({ success: true, resume: parsed, source: 'gemini' });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini extraction failed, falling back to conservative local parser:', geminiErr);
      }
    }

    // Without a Gemini key, perform conservative local parsing
    const conservativeResume = buildConservativeFallbackResume(rawText, file.name);
    if (!conservativeResume) {
      return NextResponse.json({
        success: false,
        code: 'UNREADABLE_RESUME',
        error: 'The uploaded resume could not be reliably parsed locally. Please provide a Gemini API key in Settings for native PDF extraction, or upload a pre-formatted JSON resume.',
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      resume: conservativeResume,
      source: 'conservative-fallback',
      message: 'Parsed via conservative local fallback. Provide Gemini API key in Settings for semantic extraction.',
    });
  } catch (error: any) {
    console.error('Resume upload error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process resume' }, { status: 500 });
  }
}