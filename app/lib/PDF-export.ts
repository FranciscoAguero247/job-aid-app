import { jsPDF } from 'jspdf';

export function downloadHtmlElementAsPdf(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const exportRoot = element.cloneNode(true) as HTMLElement;
  exportRoot.style.cssText = `
    width: 100%;
    max-width: 820px;
    margin: 0 auto;
    background: #ffffff;
    color: #111827;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: none;
    font-family: Arial, Helvetica, sans-serif;
    line-height: 1.5;
    padding: 32px 40px;
  `;

  exportRoot.querySelectorAll('*').forEach((node) => {
    const htmlNode = node as HTMLElement;
    const allowedClasses = [
      'resume-preview',
      'resume-preview-header',
      'resume-preview-name',
      'resume-preview-meta',
      'resume-preview-body',
      'resume-preview-section',
      'resume-preview-section-title',
      'resume-entry',
      'resume-entry-heading',
    ];

    if (!allowedClasses.some((className) => htmlNode.classList.contains(className))) {
      htmlNode.removeAttribute('class');
    }

    if (htmlNode.tagName === 'TEXTAREA') {
      htmlNode.className = '';
      htmlNode.style.cssText = `
        width: 100%;
        min-height: 220px;
        background: #ffffff;
        color: #111827;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px;
        font-size: 12px;
        line-height: 1.6;
        resize: none;
      `;
    }
  });

  const doc = new jsPDF('p', 'pt', 'a4');

  doc.html(exportRoot, {
    callback: (pdf) => {
      pdf.save(`${filename}.pdf`);
    },
    margin: [32, 32, 32, 32],
    autoPaging: 'text',
    x: 0,
    y: 0,
    html2canvas: {
      scale: 0.8,
      useCORS: true,
      backgroundColor: '#ffffff',
    },
  });
}

