import { NextRequest, NextResponse } from 'next/server';
import {
  generateTailoredResumeLocal,
  generateCoverLetterLocal,
} from '@/app/lib/generators';
import { JobApplication, MasterResume, TailoredResume } from '@/app/types';

function buildTailoredResumeSystemPrompt(resume: MasterResume): string {
  return `You are an elite, truth-anchored technical resume strategist and ATS optimization expert.
YOUR HIGHEST DIRECTIVE IS ACCURACY AND TRUTH PRESERVATION.

STRICT TRUTH GUARDRAILS:
1. IMMUTABLE FACTS: You must NEVER invent, fabricate, or hallucinate technical skills, programming languages, employers, job titles, dates, or degrees not explicitly present in the candidate's master resume.
2. PRESERVE TRUE METRICS: Do not invent, inflate, or alter numbers, percentages, or dollar amounts.
3. SURGICAL TAILORING:
- Match the candidate's evidence directly to the target role's top requirements and extracted skills.
- Re-order experience and bullets so the most relevant work appears first.
- Rephrase the summary to emphasize the role-specific value proposition.
- Align terminology truthfully (e.g. if candidate wrote "RESTful endpoints" and JD asks for "REST APIs").
- Keep only the strongest, most relevant experience and skills for this job.
4. NO FLUFF: Eliminate generic buzzwords and empty adjectives.
5. YOU MAY OMIT LESS RELEVANT EXPERIENCE if it is not strongly aligned to this job.

OUTPUT FORMAT RULES:
Return only valid JSON matching the TailoredResume schema.
Do not use Markdown, headings, or commentary.
Keep every fact grounded in the master resume.
Reorder and rewrite the supplied information only.

Use the candidate's existing contact/education details where applicable (for example: ${resume.fullName || 'candidate'}).
Required JSON structure:
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "linkedin": "string",
  "portfolio": "string",
  "summary": "string",
  "skills": [{ "category": "string", "items": ["string"] }],
  "experience": [
    {
      "id": "string",
      "role": "string",
      "company": "string",
      "location": "string",
      "period": "string",
      "bullets": ["string"]
    }
  ],
  "projects": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "link": "string",
      "githubLink": "string",
      "bullets": ["string"]
    }
  ],
  "education": [{ "degree": "string", "institution": "string", "year": "string" }]
}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, resume, application, options, apiKey } = body as {
      action: 'resume' | 'cover-letter';
      resume: MasterResume;
      application: JobApplication;
      options?: { customInstruction?: string };
      apiKey?: string;
    };

    if (action !== 'resume' && action !== 'cover-letter') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Unsupported action. Only resume and cover-letter are available in this MVP.',
        },
        { status: 400 }
      );
    }

    const geminiKey = apiKey || process.env.GEMINI_API_KEY;
    const customNote = options?.customInstruction
      ? `\nUSER SPECIFIC TWEAK REQUEST: ${options.customInstruction}`
      : '';

    let rawFallbackText = '';

    if (geminiKey) {
      try {
        let systemPrompt = '';
        let userPrompt = '';

        if (action === 'resume') {
          systemPrompt = buildTailoredResumeSystemPrompt(resume);
          userPrompt = `CANDIDATE MASTER RESUME:\n${JSON.stringify(resume, null, 2)}\n\nEXTRACTED JOB METADATA:\nCompany: ${application.company || 'Not specified'}\nPosition: ${application.position || 'Not specified'}\nRequirements: ${JSON.stringify(application.requirements || [])}\n\nFULL JOB DESCRIPTION:\n${application.jobDescription}${customNote}\n\nTask: Return only valid JSON matching the TailoredResume schema tailored to this role while staying strictly grounded in the master resume.`;
        } else {
          systemPrompt = `You are a direct, modern hiring coach and expert professional cover letter writer. Write a compelling, concise cover letter (3-4 paragraphs max) that feels specific and human.

RULES:
1. Zero generic fluff (NO robotic clichés like "thrilled to apply").
2. Use only evidence that is grounded in the candidate's real resume.
3. Show specific knowledge of the company and how the candidate's background fits the role. 
4. CRITICAL METADATA INSTRUCTION: If the company name or position title is empty, unspecified, or blank, DO NOT fabricate placeholders like "Target Company" or "Target Role". Instead, frame the opening naturally (e.g., "I am writing to express my strong interest in the open engineering position...") without inserting a fake company name.
5. Highlight 2-3 relevant achievements or strengths that match the job description.
6. Keep the tone polished, confident, and concise.

CRITICAL FORMATTING RULES:
1. Write in professional, natural prose.
2. DO NOT use markdown asterisks (**), hashes (#), or bullet points (-).
3. Output only the cover letter text, no extra commentary or headings.`;

          userPrompt = `CANDIDATE:\n${JSON.stringify(resume, null, 2)}\n\nTARGET COMPANY & POSITION:\nCompany: ${application.company || ''}\nPosition: ${application.position || ''}\nHiring Contact: ${application.contact?.name || 'Hiring Manager'}\n\nJob Description:\n${application.jobDescription}${customNote}\n\nTask: Write a tailored cover letter that matches the job requirements and reflects the candidate's real experience.`;
        }

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: userPrompt }],
                },
              ],
              generationConfig:
                action === 'resume'
                  ? {
                      responseMimeType: 'application/json',
                      temperature: 0.2,
                    }
                  : {
                      temperature: 0.5,
                    },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const generatedText: string | undefined =
            geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

          if (generatedText) {
            rawFallbackText = generatedText;

            if (action === 'cover-letter') {
              return NextResponse.json({
                success: true,
                result: generatedText,
                rawFallback: generatedText,
                source: 'gemini',
              });
            }

            // action === 'resume': parse & validate into TailoredResume
            const parsed = parseGeminiResumePayload(generatedText);
            if (parsed.valid && parsed.resume) {
              return NextResponse.json({
                success: true,
                resume: parsed.resume,
                result: parsed.resume, // kept for backward compatibility if any caller reads `data.result`
                rawFallback: generatedText,
                source: 'gemini',
              });
            }

            console.warn(
              'Gemini resume output failed TailoredResume validation, falling back to local engine:',
              parsed.error
            );
          }
        }
      } catch (err) {
        console.warn(
          'Gemini call failed or timed out, falling back to local engine:',
          err
        );
      }
    }

    // Local fallback engine
    if (action === 'resume') {
      const localResult = generateTailoredResumeLocal(
        resume,
        application,
        options as unknown as Parameters<typeof generateTailoredResumeLocal>[2]
      ) as unknown as TailoredResume;

      return NextResponse.json({
        success: true,
        resume: localResult,
        result: localResult,
        rawFallback: rawFallbackText || JSON.stringify(localResult, null, 2),
        source: 'local-engine',
      });
    }

    const coverLetterResult = generateCoverLetterLocal(
      resume,
      application,
      options as unknown as Parameters<typeof generateCoverLetterLocal>[2]
    );

    return NextResponse.json({
      success: true,
      result: coverLetterResult,
      rawFallback: rawFallbackText || coverLetterResult,
      source: 'local-engine',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Generation failed' },
      { status: 500 }
    );
  }
}

function parseGeminiResumePayload(generatedText: string): {
  valid: boolean;
  resume?: TailoredResume;
  error?: string;
} {
  if (!generatedText || typeof generatedText !== 'string') {
    return { valid: false, error: 'Gemini returned no resume text.' };
  }

  let jsonText = generatedText.trim();

  // Models may ignore responseMimeType and wrap JSON in a markdown code fence.
  const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    jsonText = fenceMatch[1].trim();
  } else {
    const objectStart = jsonText.indexOf('{');
    const objectEnd = jsonText.lastIndexOf('}');
    if (objectStart !== -1 && objectEnd > objectStart) {
      jsonText = jsonText.slice(objectStart, objectEnd + 1);
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error
          ? `Invalid JSON: ${error.message}`
          : 'Invalid JSON returned by Gemini.',
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, error: 'Gemini resume payload is not a JSON object.' };
  }

  const resume = parsed as Record<string, unknown>;
  const stringFields = [
    'fullName',
    'email',
    'phone',
    'location',
    'linkedin',
    'portfolio',
    'summary',
  ];

  for (const field of stringFields) {
    if (typeof resume[field] !== 'string') {
      return {
        valid: false,
        error: `Missing or invalid string field: ${field}.`,
      };
    }
  }

  if (
    !Array.isArray(resume.skills) ||
    !resume.skills.every(
      (skill) =>
        skill &&
        typeof skill === 'object' &&
        typeof (skill as Record<string, unknown>).category === 'string' &&
        Array.isArray((skill as Record<string, unknown>).items) &&
        ((skill as Record<string, unknown>).items as unknown[]).every(
          (item) => typeof item === 'string'
        )
    )
  ) {
    return { valid: false, error: 'Missing or invalid skills array.' };
  }

  if (
    !Array.isArray(resume.experience) ||
    !resume.experience.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        ['id', 'role', 'company', 'location', 'period'].every(
          (field) => typeof (item as Record<string, unknown>)[field] === 'string'
        ) &&
        Array.isArray((item as Record<string, unknown>).bullets) &&
        ((item as Record<string, unknown>).bullets as unknown[]).every(
          (bullet) => typeof bullet === 'string'
        )
    )
  ) {
    return { valid: false, error: 'Missing or invalid experience array.' };
  }

  if (
    !Array.isArray(resume.projects) ||
    !resume.projects.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        ['id', 'name', 'description', 'link', 'githubLink'].every(
          (field) => typeof (item as Record<string, unknown>)[field] === 'string'
        ) &&
        Array.isArray((item as Record<string, unknown>).technologies) &&
        ((item as Record<string, unknown>).technologies as unknown[]).every(
          (technology) => typeof technology === 'string'
        ) &&
        Array.isArray((item as Record<string, unknown>).bullets) &&
        ((item as Record<string, unknown>).bullets as unknown[]).every(
          (bullet) => typeof bullet === 'string'
        )
    )
  ) {
    return { valid: false, error: 'Missing or invalid projects array.' };
  }

  if (
    !Array.isArray(resume.education) ||
    !resume.education.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        ['degree', 'institution', 'year'].every(
          (field) => typeof (item as Record<string, unknown>)[field] === 'string'
        )
    )
  ) {
    return { valid: false, error: 'Missing or invalid education array.' };
  }

  return { valid: true, resume: resume as unknown as TailoredResume };
}
