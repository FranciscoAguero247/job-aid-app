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
   - Identify genuine overlap between candidate's real experience and the job requirements.
   - Re-order existing bullet points so the most relevant achievements appear first.
   - Align terminology truthfully (e.g. if candidate wrote "RESTful endpoints" and JD asks for "REST APIs").
   - Craft an executive summary highlighting candidate's real relevant background.
4. NO FLUFF: Eliminate robotic buzzwords ("spearheaded", "synergy", "deeply passionate").
5. FORMAT: Return cleanly formatted Markdown ready for ATS scanning and 1-page PDF export.`;

          userPrompt = `CANDIDATE MASTER RESUME:\n${JSON.stringify(resume, null, 2)}\n\nTARGET JOB:\nCompany: ${application.company}\nTitle: ${application.position}\nJob Description:\n${application.jobDescription}${customNote}`;
        } else if (action === 'cover-letter') {
          systemPrompt = `You are a direct, modern hiring coach. Write a compelling, concise cover letter (3-4 paragraphs maximum).
RULES:
1. Zero generic fluff (NO "I am writing to express my enthusiasm", NO "thrilled to apply", NO robotic clichés).
2. Hook: Show specific knowledge of the company's product or engineering mission.
3. Evidence: Highlight 2 specific high-scale metrics directly from the candidate's actual resume that match the job's core challenges.
4. Professional, confident, and direct call to action.`;

          userPrompt = `CANDIDATE:\n${JSON.stringify(resume, null, 2)}\n\nJOB APPLICATION:\nCompany: ${application.company}\nRole: ${application.position}\nHiring Contact: ${application.contact?.name || 'Hiring Manager'}\nJob Description:\n${application.jobDescription}${customNote}`;
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

