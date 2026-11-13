import { NextRequest, NextResponse } from 'next/server';
import { 
  generateTailoredResumeLocal, 
  generateCoverLetterLocal, 
  generateFollowUpLocal, 
  generateNetworkingMessageLocal 
} from '@/app/lib/generators';
import { JobApplication, MasterResume } from '@/app/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, resume, application, options, apiKey } = body as {
      action: 'resume' | 'cover-letter' | 'follow-up' | 'networking';
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

        if (action === 'resume') {
          systemPrompt = `You are an elite executive career coach and technical resume strategist. 
Tailor the candidate's master resume to strongly match the provided job description.
RULES:
1. Preserve true factual metrics and career history.
2. Emphasize matching tech stack keywords, engineering challenges, and business impact.
3. Output cleanly formatted Markdown suitable for rendering as an ATS-optimized 1-page technical resume.
4. Include a concise summary, key matched competencies, and 3-4 achievement bullet points per role highlighting scale and metrics.`;

          userPrompt = `CANDIDATE MASTER RESUME:\n${JSON.stringify(resume, null, 2)}\n\nTARGET JOB:\nCompany: ${application.company}\nTitle: ${application.position}\nJob Description:\n${application.jobDescription}`;
        } else if (action === 'cover-letter') {
          systemPrompt = `You are a direct, modern hiring coach. Write a compelling, concise cover letter (3-4 paragraphs maximum).
RULES:
1. Zero generic fluff (NO "I am writing to express my enthusiasm", NO "thrilled to apply", NO robotic clichés).
2. Hook: Show specific knowledge of the company's product or recent engineering work.
3. Evidence: Highlight 2 specific high-scale metrics from the candidate's resume that match the job's core challenges.
4. Professional, confident, and direct call to action.`;

          userPrompt = `CANDIDATE:\n${JSON.stringify(resume, null, 2)}\n\nJOB APPLICATION:\nCompany: ${application.company}\nRole: ${application.position}\nHiring Contact: ${application.contact?.name || 'Hiring Manager'}\nJob Description:\n${application.jobDescription}`;
        } else if (action === 'follow-up') {
          systemPrompt = `You are an expert on candidate communication. Draft a polite, timeline-aware follow-up email.
RULES:
1. Keep it under 150 words.
2. Direct, polite, and low-friction for the recipient to reply.
3. Output JSON with format: {"subject": "...", "body": "...", "timingTip": "..."}`;

          userPrompt = `JOB: ${application.position} at ${application.company}
APPLIED DATE: ${application.appliedDate}
STATUS: ${application.status}
CONTACT: ${application.contact?.name || 'Hiring Team'} (${application.contact?.email || 'N/A'})
SCENARIO: ${options?.scenario || 'check-in'}
CANDIDATE: ${resume.fullName}`;
        } else if (action === 'networking') {
          systemPrompt = `You are the "Anti-Jargon Human Tone Engine". You write authentic, human-sounding LinkedIn notes.
RULES:
1. FORBIDDEN WORDS: "hope this finds you well", "thrilled", "esteemed", "spearheaded", "synergy", "deeply passionate", "kindly".
2. If format is 'connection-note', character count MUST BE strictly under 295 characters!
3. Keep tone conversational, respectful, and peer-to-peer.
4. Output JSON with format: {"message": "...", "charCount": 0, "targetRole": "${options?.persona || 'recruiter'}"}`;

          userPrompt = `TARGET: ${application.contact?.name || 'Contact'} (${options?.persona}) at ${application.company}
JOB: ${application.position}
FORMAT: ${options?.format || 'connection-note'}
CANDIDATE: ${resume.fullName}, Senior Software Engineer`;
        }

        // Call Gemini REST endpoint
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
            if (action === 'follow-up' || action === 'networking') {
              try {
                // Parse JSON if response is fenced in markdown
                const cleanedJson = generatedText.replace(/```json\n?|\n?```/g, '').trim();
                const parsed = JSON.parse(cleanedJson);
                return NextResponse.json({ success: true, result: parsed, source: 'gemini' });
              } catch {
                // fallback to text response
                return NextResponse.json({ success: true, result: generatedText, source: 'gemini' });
              }
            }
            return NextResponse.json({ success: true, result: generatedText, source: 'gemini' });
          }
        }
      } catch (err) {
        console.warn('Gemini call failed or timed out, falling back to local engine:', err);
      }
    }

    // High quality local fallback engine
    let result: any = null;
    if (action === 'resume') {
      result = generateTailoredResumeLocal(resume, application, options);
    } else if (action === 'cover-letter') {
      result = generateCoverLetterLocal(resume, application, options);
    } else if (action === 'follow-up') {
      result = generateFollowUpLocal(resume, application, options || { scenario: 'check-in', recipientType: 'hiring-manager' });
    } else if (action === 'networking') {
      result = generateNetworkingMessageLocal(resume, application, options || { persona: 'recruiter', format: 'connection-note', tone: 'casual' });
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
