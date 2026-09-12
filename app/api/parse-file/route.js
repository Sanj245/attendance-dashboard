import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

function extractPdfTextStreams(pdfBuffer) {
  const str = pdfBuffer.toString('binary');
  const textMatches = [];
  const regex = /\(([^()]+)\)\s*T[Jj]/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    const text = match[1];
    if (text && text.trim().length > 1) {
      textMatches.push(text.trim());
    }
  }
  return textMatches.join(' ');
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || '';
    const fileName = file.name || '';

    let extractedText = '';

    // Handle PDF files
    if (mimeType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
      extractedText = extractPdfTextStreams(buffer);
    }

    // If PDF text stream extraction didn't yield text OR if file is an image, run Tesseract OCR
    if (!extractedText.trim()) {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(buffer);
      extractedText = ret.data.text || '';
      await worker.terminate();
    }

    const cleanText = extractedText.trim();
    if (!cleanText || cleanText.length < 3) {
      return NextResponse.json({ error: 'Could not detect clear text from file. Please ensure document/image is clear.' }, { status: 422 });
    }

    return NextResponse.json({ success: true, text: cleanText });
  } catch (error) {
    console.error('Error in /api/parse-file:', error);
    return NextResponse.json({ error: 'File parsing failed: ' + error.message }, { status: 500 });
  }
}
