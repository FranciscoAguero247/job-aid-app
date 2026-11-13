import { NextRequest, NextResponse } from 'next/server';
import { JobApplication, ApplicationStatus } from '@/app/types';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(s => s.replace(/^"|"$/g, '').trim());
}

export async function POST(req: NextRequest) {
  try {
    const { sheetUrl, rawData } = await req.json();

    let csvContent = '';

    if (rawData) {
      csvContent = rawData;
    } else if (sheetUrl) {
      let exportUrl = sheetUrl;
      // Convert standard Google Sheet URL to direct CSV export URL
      if (sheetUrl.includes('docs.google.com/spreadsheets/d/')) {
        const matches = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (matches && matches[1]) {
          const sheetId = matches[1];
          exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        }
      }

      const res = await fetch(exportUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch sheet (${res.status}). Make sure the sheet is shared as "Anyone with the link can view".`);
      }

      csvContent = await res.text();
    } else {
      return NextResponse.json({ success: false, error: 'No sheet URL or data provided' }, { status: 400 });
    }

    // Parse CSV rows
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      return NextResponse.json({ success: false, error: 'Sheet is empty or has no data rows' }, { status: 400 });
    }

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
    
    // Find column indexes
    const colCompany = headers.findIndex(h => h.includes('company') || h.includes('employer'));
    const colPosition = headers.findIndex(h => h.includes('role') || h.includes('position') || h.includes('title'));
    const colStatus = headers.findIndex(h => h.includes('status') || h.includes('stage'));
    const colDate = headers.findIndex(h => h.includes('applied') || h.includes('date'));
    const colSalary = headers.findIndex(h => h.includes('salary') || h.includes('compensation'));
    const colLocation = headers.findIndex(h => h.includes('location'));
    const colNotes = headers.findIndex(h => h.includes('note') || h.includes('comment'));
    const colUrl = headers.findIndex(h => h.includes('url') || h.includes('link'));

    const applications: JobApplication[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (!row || row.length === 0 || !row[colCompany >= 0 ? colCompany : 0]) continue;

      const company = colCompany >= 0 ? row[colCompany] : row[0];
      const position = colPosition >= 0 ? row[colPosition] : (row[1] || 'Software Engineer');
      const rawStatus = (colStatus >= 0 ? row[colStatus] : 'Applied').toLowerCase();
      
      let status: ApplicationStatus = 'Applied';
      if (rawStatus.includes('screen') || rawStatus.includes('recruiter')) status = 'Recruiter Screen';
      else if (rawStatus.includes('tech') || rawStatus.includes('interview')) status = 'Technical Interview';
      else if (rawStatus.includes('final')) status = 'Final Round';
      else if (rawStatus.includes('offer')) status = 'Offer';
      else if (rawStatus.includes('reject')) status = 'Rejected';
      else if (rawStatus.includes('bookmark') || rawStatus.includes('saved')) status = 'Bookmarked';

      const appliedDate = colDate >= 0 && row[colDate] ? row[colDate] : new Date().toISOString().split('T')[0];
      const salary = colSalary >= 0 ? row[colSalary] : undefined;
      const location = colLocation >= 0 ? row[colLocation] : 'Remote / Hybrid';
      const notes = colNotes >= 0 ? row[colNotes] : undefined;
      const jobUrl = colUrl >= 0 ? row[colUrl] : undefined;

      applications.push({
        id: `sheet-${i}-${Date.now()}`,
        company,
        position,
        location,
        workplaceType: location.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid',
        salary,
        status,
        appliedDate,
        lastContactDate: appliedDate,
        jobUrl,
        notes,
        jobDescription: `Imported from Google Tracker Sheet for ${position} at ${company}. Add specific requirements or details to enhance tailoring.`,
        matchScore: Math.floor(Math.random() * 15) + 85
      });
    }

    return NextResponse.json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
