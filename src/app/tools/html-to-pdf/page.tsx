'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import styles from './page.module.css';

export default function HtmlToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'converting' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setStatus('idle');
      setErrorMsg('');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setStatus('idle');
      setErrorMsg('');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file, 'UTF-8');
    });

  const renderHtmlInIframe = (html: string): Promise<HTMLIFrameElement> =>
    new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '800px';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) {
        document.body.removeChild(iframe);
        reject(new Error('Could not create iframe'));
        return;
      }

      const wrapped = /^\s*<!DOCTYPE|^\s*<html/i.test(html)
        ? html
        : `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:12px;font-family:system-ui,sans-serif;">${html}</body></html>`;
      doc.open();
      doc.write(wrapped);
      doc.close();

      win.onload = () => resolve(iframe);
      setTimeout(() => resolve(iframe), 2000);
    });

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setStatus('converting');
    setErrorMsg('');
    let iframe: HTMLIFrameElement | null = null;

    try {
      const html = await readFileAsText(file);
      iframe = await renderHtmlInIframe(html);
      if (!iframe?.contentDocument?.body) {
        throw new Error('Could not render HTML');
      }

      const canvas = await html2canvas(iframe.contentDocument.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }

      const imgW = canvas.width;
      const imgH = canvas.height;
      const doc = new jsPDF({ unit: 'pt' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const scale = pageW / imgW;
      const scaledH = imgH * scale;
      const totalPages = Math.max(1, Math.ceil(scaledH / pageH));

      for (let p = 0; p < totalPages; p++) {
        if (p > 0) doc.addPage();
        const sourceY = (p * pageH) / scale;
        const sourceH = Math.min(pageH / scale, imgH - sourceY);
        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = imgW;
        sourceCanvas.height = Math.ceil(sourceH);
        const ctx = sourceCanvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not available');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, imgW, sourceCanvas.height);
        ctx.drawImage(canvas, 0, sourceY, imgW, sourceH, 0, 0, imgW, sourceH);
        const dataUrl = sourceCanvas.toDataURL('image/jpeg', 0.92);
        const drawH = Math.min(pageH, sourceH * scale);
        doc.addImage(dataUrl, 'JPEG', 0, 0, pageW, drawH);
      }

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'document';
      doc.save(`${baseName}.pdf`);
      setStatus('done');
    } catch (err) {
      if (iframe?.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      setErrorMsg(err instanceof Error ? err.message : 'Conversion failed');
      setStatus('error');
    }
  }, [file]);

  const triggerInput = () => inputRef.current?.click();

  return (
    <main className={styles.main}>
      <div className={styles.toolContainer}>
        <Link href="/" className={styles.backLink}>← Back to all tools</Link>
        <h1 className={styles.toolTitle}>HTML to PDF</h1>
        <p className={styles.toolDescription}>
          Convert HTML files to PDF. All processing happens locally in your browser.
        </p>
        <div
          className={styles.uploadArea}
          onClick={triggerInput}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && triggerInput()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".html,.htm,text/html"
            onChange={handleFileChange}
            className={styles.fileInput}
            aria-label="Select HTML file"
          />
          <div className={styles.uploadVisual} aria-hidden />
          <p className={styles.uploadText}>
            {file ? file.name : 'Click to select HTML or drag and drop'}
          </p>
          <p className={styles.uploadHint}>HTML files (.html, .htm)</p>
        </div>
        {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}
        <button
          className={styles.convertButton}
          disabled={!file || status === 'converting'}
          onClick={handleConvert}
        >
          {status === 'converting' ? 'Converting…' : 'Convert to PDF'}
        </button>
      </div>
      <footer className={styles.footer}>
        <p>© 2026 tree.je — All rights reserved</p>
      </footer>
    </main>
  );
}
