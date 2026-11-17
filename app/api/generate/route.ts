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

    // If Gemini key is available, attempt real LLM call
    if (geminiKey) {
      try {
        let systemPrompt = '';
        let userPrompt = '';
        const customNote = options?.customInstruction ? `\nUSER SPECIFIC TWEAK REQUEST: ${options.customInstruction}` : '';

        if (action === 'resume') {
          systemPrompt = `You are an elite, truth-anchored technical resume strategist.
YOUR HIGHEST DIRECTIVE IS ACCURACY AND TRUTH PRESERVATION.

STRICT TRUTH GUARDRAILS:
1. IMMUTABLE FACTS: You must NEVER invent, fabricate, or hallucinate technical skills, programming languages, employers, job titles, dates, or degrees not explicitly present in the candidate's master resume.
2. PRESERVE TRUE METRICS: Do not invent or inflate numbers, percentages, or dollar amounts.
3. SURGICAL TAILORING:
   - Match the candidate's evidence directly to the target role's top requirements.
   - Re-order experience and bullets so the most relevant work appears first.
   - Rephrase the summary to emphasize the role-specific value proposition.
   - Align terminology truthfully (e.g. if candidate wrote "RESTful endpoints" and JD asks for "REST APIs").
   - Keep only the strongest, most relevant experience and skills for this job.
4. NO FLUFF: Eliminate generic buzzwords and empty adjectives.
5. FORMAT: Return clean, ATS-friendly Markdown with sections for summary, core skills, experience, and education, ready for PDF export.
6. YOU MAY OMIT LESS RELEVANT EXPERIENCE if it is not strongly aligned to this job.
7. Keep the resume concise and credible, not inflated.`;

          userPrompt = `CANDIDATE MASTER RESUME:\n${JSON.stringify(resume, null, 2)}\n\nTARGET JOB:\nCompany: ${application.company}\nTitle: ${application.position}\nJob Description:\n${application.jobDescription}${customNote}\n\nTask: Rewrite the resume to maximize fit for this specific role while staying truthful to the candidate's actual experience.`;
        } else if (action === 'cover-letter') {
          systemPrompt = `You are a direct, modern hiring coach. Write a compelling, concise cover letter (3-4 paragraphs max) that feels specific and human.
RULES:
1. Zero generic fluff (NO "I am writing to express my enthusiasm", NO "thrilled to apply", NO robotic clichés).
2. Use only evidence that is grounded in the candidate's real resume.
3. Show specific knowledge of the company and how the candidate's background fits the role.
4. Highlight 2-3 relevant achievements or strengths that match the job description.
5. Keep the tone polished, confident, and concise.
6. Output only the cover letter text, no extra commentary or headings.`;

          userPrompt = `CANDIDATE:\n${JSON.stringify(resume, null, 2)}\n\nJOB APPLICATION:\nCompany: ${application.company}\nRole: ${application.position}\nHiring Contact: ${application.contact?.name || 'Hiring Manager'}\nJob Description:\n${application.jobDescription}${customNote}\n\nTask: Write a tailored cover letter that matches the job requirements and reflects the candidate's real experience.`;
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

