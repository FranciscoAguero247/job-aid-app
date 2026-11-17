import { jsPDF } from 'jspdf';

function splitTextIntoLines(text: string, maxCharsPerLine = 90): string[] {
  return text
    .split(/\n/)
    .flatMap((paragraph) => {
      const words = paragraph.split(/\s+/);
      const lines: string[] = [];
      let current = '';

      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= maxCharsPerLine) {
          current = candidate;
        } else {
          if (current) lines.push(current);
          current = word;
        }
      }

      if (current) lines.push(current);
      return lines;
    });
}

export function downloadTextAsPdf(filename: string, content: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const marginY = 52;
  const maxLineWidth = pageWidth - marginX * 2;
  const lineHeight = 18;

  const safeContent = (content || '').replace(/\r/g, '').trim();
  const lines = splitTextIntoLines(safeContent);

  let y = marginY;
  let pageNumber = 1;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  for (const line of lines) {
    const textLines = doc.splitTextToSize(line, maxLineWidth);

    for (const segment of textLines) {
      if (y > pageHeight - marginY) {
        doc.addPage();
        pageNumber += 1;
        y = marginY;
      }

      doc.text(segment, marginX, y);
      y += lineHeight;
    }
  }

  doc.save(`${filename}.pdf`);
}

