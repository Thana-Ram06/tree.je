'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import styles from './page.module.css';

export default function TxtToPdfPage() {
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

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setStatus('converting');
    setErrorMsg('');
    try {
      const text = await readFileAsText(file);
      const doc = new jsPDF({ unit: 'pt' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 40;
      const maxW = pageW - margin * 2;
      const lineHeight = 12;
      const fontSize = 11;

      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'normal');

      const lines = doc.splitTextToSize(text || ' ', maxW);
      let y = margin;

      for (let i = 0; i < lines.length; i++) {
        if (y + lineHeight > pageH - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(lines[i], margin, y);
        y += lineHeight;
      }

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'document';
      doc.save(`${baseName}.pdf`);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Conversion failed');
      setStatus('error');
    }
  }, [file]);

  const triggerInput = () => inputRef.current?.click();

  return (
    <main className={styles.main}>
      <div className={styles.toolContainer}>
        <Link href="/" className={styles.backLink}>← Back to all tools</Link>
        <h1 className={styles.toolTitle}>TXT to PDF</h1>
        <p className={styles.toolDescription}>
          Convert plain text files to PDF. All processing happens locally in your browser.
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
            accept=".txt,text/plain"
            onChange={handleFileChange}
            className={styles.fileInput}
            aria-label="Select TXT file"
          />
          <div className={styles.uploadVisual} aria-hidden />
          <p className={styles.uploadText}>
            {file ? file.name : 'Click to select TXT or drag and drop'}
          </p>
          <p className={styles.uploadHint}>Plain text (.txt) only</p>
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
