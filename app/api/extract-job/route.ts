import { NextRequest, NextResponse } from 'next/server';
import { ExtractedJobInfo } from '@/app/types';

export async function POST(req: NextRequest) {
  try {
    const { url, rawText, apiKey } = await req.json();
    const geminiKey = apiKey || process.env.GEMINI_API_KEY;

    let contentToAnalyze = rawText || '';

    // If a URL was provided, attempt to fetch the webpage content
    if (url && url.startsWith('http')) {
      try {
        const fetchRes = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(8000),
        });

        if (fetchRes.ok) {
          const html = await fetchRes.text();
          // Basic HTML text extraction: strip scripts, styles, and tags
          contentToAnalyze = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 10000); // Take first 10,000 characters
        }
      } catch (fetchErr) {
        console.warn('Direct URL fetch failed, falling back to URL heuristics:', fetchErr);
      }
    }

    if (!contentToAnalyze && !url) {
      return NextResponse.json({ success: false, error: 'Provide a valid job URL or job description text' }, { status: 400 });
    }

    // If Gemini key is available, use LLM to extract clean structured fields
    if (geminiKey && contentToAnalyze) {
      try {
        const prompt = `Analyze this job posting and extract the details in valid JSON conforming to this schema:
{
  "company": string,
  "position": string,
  "location": string,
  "workplaceType": "Remote" | "Hybrid" | "On-site",
  "salary": string (optional or ""),
  "jobDescription": string (clean, concise text of key responsibilities, requirements, and qualifications)
}

POSTING:
${contentToAnalyze.slice(0, 7000)}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text) as ExtractedJobInfo;
            return NextResponse.json({ success: true, job: parsed, source: 'gemini' });
          }
        }
      } catch (err) {
        console.warn('Gemini job extraction error, falling back:', err);
      }
    }

    // Local heuristic extractor
    let company = 'Target Company';
    let position = 'Software Engineer';
    let location = 'Remote / United States';
    let workplaceType: 'Remote' | 'Hybrid' | 'On-site' = 'Remote';

    // Heuristics from URL domain if available
    if (url) {
      try {
        const parsedUrl = new URL(url);
        const hostParts = parsedUrl.hostname.replace('www.', '').split('.');
        if (hostParts.length >= 2) {
          const domainName = hostParts[0];
          if (!['linkedin', 'indeed', 'glassdoor', 'greenhouse', 'lever', 'workday'].includes(domainName.toLowerCase())) {
            company = domainName.charAt(0).toUpperCase() + domainName.slice(1);
          }
        }
      } catch {}
    }

    // Heuristics from text
    const lower = contentToAnalyze.toLowerCase();
    if (lower.includes('frontend') || lower.includes('front-end')) position = 'Senior Frontend Engineer';
    else if (lower.includes('full stack') || lower.includes('fullstack')) position = 'Full Stack Engineer';
    else if (lower.includes('backend') || lower.includes('back-end')) position = 'Backend Engineer';
    else if (lower.includes('engineering manager')) position = 'Engineering Manager';
    else if (lower.includes('lead engineer')) position = 'Lead Software Engineer';

    if (lower.includes('hybrid')) workplaceType = 'Hybrid';
    else if (lower.includes('on-site') || lower.includes('onsite')) workplaceType = 'On-site';

    const fallbackJob: ExtractedJobInfo = {
      company,
      position,
      location,
      workplaceType,
      jobDescription: contentToAnalyze || 'Job description details provided by candidate.',
    };

    return NextResponse.json({ success: true, job: fallbackJob, source: 'heuristic' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to extract job' }, { status: 500 });
  }
}
