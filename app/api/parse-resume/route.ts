import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { NextRequest, NextResponse } from 'next/server';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { MasterResume } from '@/app/types';

const pdfWorkerUrl = pathToFileURL(path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs')).href;

async function extractPdfTextFromBuffer(buffer: Buffer): Promise<string> {
  try {
    const pdfData = new Uint8Array(buffer);
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

    const loadingTask = pdfjsLib.getDocument({
      data: pdfData,
      useSystemFonts: true,
      isEvalSupported: false,
    } as any);

    const pdf = await loadingTask.promise;

    const pages: string[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const text = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (text) {
        pages.push(text);
      }
    }

    return pages.join('\n\n');
  } catch (error) {
    console.warn('Local PDF extraction failed:', error);
    return '';
  }
}

function buildFallbackResume(rawText: string, fileName: string): MasterResume | null {
  const normalizedText = rawText.replace(/\s+/g, ' ').trim();
  if (!normalizedText || normalizedText.length < 10) {
    return null;
  }

  const emailMatch = normalizedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = normalizedText.match(/(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = normalizedText.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/);
  const githubMatch = normalizedText.match(/github\.com\/([a-zA-Z0-9_-]+)/);
  const portfolioMatch = normalizedText.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/i);

  const fileBaseName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const candidateNameLine = normalizedText
    .split(/\n|\s{2,}/)
    .find((line) => {
      const trimmed = line.trim();
      return trimmed && /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/.test(trimmed);
    }) || fileBaseName;

  const summary = normalizedText.length > 220
    ? normalizedText.slice(0, 220).trim()
    : normalizedText;

  const skills = normalizedText
    .split(/\s+/)
    .filter((token) => token.length > 2)
    .slice(0, 20)
    .map((skill) => skill.replace(/[,.;]/g, ''));

  const fallbackResume: MasterResume = {
    fullName: candidateNameLine.trim(),
    email: emailMatch?.[0] || '',
    phone: phoneMatch?.[0] || '',
    location: '',
    linkedin: linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : '',
    github: githubMatch ? `https://github.com/${githubMatch[1]}` : '',
    portfolio: portfolioMatch ? portfolioMatch[0] : '',
    summary,
    experience: [
      {
        id: 'exp-1',
        role: 'Professional Experience',
        company: '',
        location: '',
        period: '',
        bullets: [summary],
      },
    ],
    projects: [],
    skills: [
      {
        category: 'Detected Skills',
        items: skills.length ? skills : ['resume'],
      },
    ],
    education: [],
  };

  return fallbackResume;
}

function parseGeminiResumePayload(rawText: string): MasterResume | null {
  try {
    const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned) as Partial<MasterResume>;

    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.fullName || !Array.isArray(parsed.experience) || !Array.isArray(parsed.skills)) {
      return null;
    }

    return {
      fullName: parsed.fullName || '',
      email: parsed.email || '',
      phone: parsed.phone || '',
      location: parsed.location || '',
      linkedin: parsed.linkedin || '',
      github: parsed.github || '',
      portfolio: parsed.portfolio || '',
      summary: parsed.summary || '',
      experience: parsed.experience.map((exp, index) => ({
        id: exp?.id || `exp-${index + 1}`,
        role: exp?.role || '',
        company: exp?.company || '',
        location: exp?.location || '',
        period: exp?.period || '',
        bullets: Array.isArray(exp?.bullets) ? exp.bullets : [],
      })),
      projects: Array.isArray(parsed.projects) ? parsed.projects.map((proj, index) => ({
        id: proj?.id || `proj-${index + 1}`,
        name: proj?.name || '',
        description: proj?.description || '',
        technologies: Array.isArray(proj?.technologies) ? proj.technologies : [],
        link: proj?.link || '',
        githubLink: proj?.githubLink || '',
        bullets: Array.isArray(proj?.bullets) ? proj.bullets : [],
      })) : [],
      skills: parsed.skills.map((group, index) => ({
        category: group?.category || `Skill Group ${index + 1}`,
        items: Array.isArray(group?.items) ? group.items : [],
      })),
      education: Array.isArray(parsed.education) ? parsed.education.map((edu) => ({
        degree: edu?.degree || '',
        institution: edu?.institution || '',
        year: edu?.year || '',
      })) : [],
    };
  } catch {
    return null;
  }
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
          if (parsedJson.fullName && (parsedJson.experience || parsedJson.skills)) {
            return NextResponse.json({ success: true, resume: parsedJson as MasterResume, source: 'json-direct' });
          }
        } catch {
          // continue to AI or fallback parser
        }
      }
    }

    if (apiKey) {
      try {
        const resumeData = buildFallbackResume(rawText, file.name) ?? {
          fullName: '',
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          github: '',
          portfolio: '',
          summary: '',
          experience: [],
          projects: [],
          skills: [],
          education: [],
        };

        const systemPrompt = `You are an elite, highly accurate resume data extraction engine.
        TASK: Convert the provided resume text into a clean, valid MasterResume JSON object.

        CANDIDATE RESUME TEXT:
        ${rawText || 'No resume text was extracted.'}

        EXISTING HEURISTIC STRUCTURE (for reference only):
        ${JSON.stringify(resumeData, null, 2)}

        OUTPUT REQUIREMENTS:
        1. Extract all genuine factual employment history, company names, job titles, projects, and dates accurately.
        2. Preserve metrics, percentages, and accomplishments when present.
        3. Do not invent degrees, employers, tools, or credentials.
        4. Output ONLY valid parseable JSON that matches the MasterResume schema.
        5. Use plain text for summary and bullet content. Do not include markdown formatting symbols.
        6. If some fields are not present, leave them as empty strings or empty arrays rather than inventing data.
        `;

        const parts: any[] = [];
        if (isPdf && base64Pdf) {
          parts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Pdf,
            },
          });
          parts.push({
            text: `${systemPrompt}\n\nParse the attached PDF resume into the JSON schema.`,
          });
        } else {
          parts.push({
            text: `${systemPrompt}\n\nCANDIDATE RESUME TEXT:\n${rawText}`,
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
        console.warn('Gemini resume parsing failed, using fallback:', geminiErr);
      }
    }

    const hasMeaningfulText = !!rawText && rawText.replace(/\s+/g, ' ').trim().length >= 10;

    if (isPdf && !hasMeaningfulText && !apiKey) {
      return NextResponse.json({
        success: false,
        code: 'SCANNED_OR_IMAGE_PDF',
        error: 'Resume text could not be read locally. Please provide a Gemini API key for native PDF parsing, or upload a text-based PDF or .txt resume.',
      }, { status: 422 });
    }

    const heuristicResume = buildFallbackResume(rawText, file.name);
    if (!heuristicResume) {
      return NextResponse.json({
        success: false,
        code: 'UNREADABLE_RESUME',
        error: 'The uploaded resume is unreadable. Please upload a text-based PDF, plain text resume, or JSON resume.',
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      resume: heuristicResume,
      source: 'heuristic-fallback',
      message: 'Parsed via local fallback. Provide Gemini API key in Settings for deeper semantic extraction.',
    });
  } catch (error: any) {
    console.error('Resume upload error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to process resume' }, { status: 500 });
  }
}