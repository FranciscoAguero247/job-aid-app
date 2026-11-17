import { NextRequest, NextResponse } from 'next/server';
import { 
  generateTailoredResumeLocal, 
  generateCoverLetterLocal,
} from '@/app/lib/generators';
import { JobApplication, MasterResume } from '@/app/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, resume, application, options, apiKey } = body as {
      action: 'resume' | 'cover-letter';
      resume: MasterResume;
      application: JobApplication;
      options?: any;
      apiKey?: string;
    };

    const geminiKey = apiKey || process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        let systemPrompt = '';
        let userPrompt = '';
        const customNote = options?.customInstruction ? `\nUSER SPECIFIC TWEAK REQUEST: ${options.customInstruction}` : '';

        if (action === 'resume') {
          systemPrompt = `You are an elite, truth-anchored technical resume strategist and ATS optimization expert.
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

CRITICAL FORMATTING RULES:
1. Output all summary sentences and achievement bullets as clean, professional plain text.
2. DO NOT include markdown formatting symbols like asterisks (**), hashes (#), or markdown bullets (-).
3. Return clean, ATS-friendly text structured with clear section headers ready for PDF export.`;

          userPrompt = `CANDIDATE MASTER RESUME:\n${JSON.stringify(resume, null, 2)}\n\nEXTRACTED JOB METADATA:\nCompany: ${application.company || 'Not specified'}\nPosition: ${application.position || 'Not specified'}\nRequirements: ${JSON.stringify(application.requirements || [])}\n\nFULL JOB DESCRIPTION:\n${application.jobDescription}${customNote}\n\nTask: Rewrite the resume to maximize fit for this specific role while staying strictly truthful to the candidate's actual experience.`;
        } else if (action === 'cover-letter') {
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
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
                }
              ]
            })
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            return NextResponse.json({ success: true, result: generatedText, source: 'gemini' });
          }
        }
      } catch (err) {
        console.warn('Gemini call failed or timed out, falling back to local engine:', err);
      }
    }

    let result: any = null;
    if (action === 'resume') {
      result = generateTailoredResumeLocal(resume, application, options);
    } else if (action === 'cover-letter') {
      result = generateCoverLetterLocal(resume, application, options);
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported action. Only resume and cover-letter are available in this MVP.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
      source: 'local-engine'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}

