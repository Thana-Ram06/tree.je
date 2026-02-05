'use client';

import { Suspense, useCallback, useState, useRef } from 'react';
import Link from 'next/link';
import styles from '../shared-tool.module.css';

function PdfRotateContent() {
    const [file, setFile] = useState<File | null>(null);
    const [rotation, setRotation] = useState<number>(90);
    const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f?.type === 'application/pdf') {
            setFile(f);
            setStatus('idle');
            setErrorMsg('');
        } else if (f) {
            setFile(null);
            setErrorMsg('Please select a PDF file.');
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f?.type === 'application/pdf') {
            setFile(f);
            setStatus('idle');
            setErrorMsg('');
        } else if (f) {
            setErrorMsg('Please drop a PDF file.');
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

    const handleRotate = async () => {
        if (!file) return;

        setStatus('processing');
        setErrorMsg('');

        try {
            const { PDFDocument, degrees } = await import('pdf-lib');
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const pages = pdf.getPages();

            pages.forEach((page) => {
                const currentRotation = page.getRotation().angle;
                page.setRotation(degrees(currentRotation + rotation));
            });

            const pdfBytes = await pdf.save();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rotated_${file.name}`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 100);

            setStatus('done');
        } catch (err) {
            console.error(err);
            setErrorMsg('Failed to rotate PDF.');
            setStatus('error');
        }
    };

    const triggerInput = () => inputRef.current?.click();

    return (
        <main className={styles.main}>
            <div className={styles.toolContainer}>
                <Link href="/" className={styles.backLink}>← Back to all tools</Link>

                <h1 className={styles.toolTitle}>PDF Rotate</h1>
                <p className={styles.toolDescription}>
                    Rotate pages in your PDF file permanently.
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
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className={styles.fileInput}
                        aria-label="Select PDF file"
                    />
                    <div className={styles.uploadVisual} aria-hidden />
                    <p className={styles.uploadText}>
                        {file ? file.name : 'Click to select PDF or drag and drop'}
                    </p>
                </div>

                {file && (
                    <div className={styles.options}>
                        <div className={styles.optionGroup}>
                            <label htmlFor="rotation">Rotation (Clockwise)</label>
                            <select
                                id="rotation"
                                className={styles.select}
                                value={rotation}
                                onChange={(e) => setRotation(Number(e.target.value))}
                            >
                                <option value="90">90 Degrees</option>
                                <option value="180">180 Degrees</option>
                                <option value="270">270 Degrees</option>
                            </select>
                        </div>
                    </div>
                )}

                {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}

                <button
                    className={styles.convertButton}
                    disabled={!file || status === 'processing'}
                    onClick={handleRotate}
                >
                    {status === 'processing' ? 'Processing...' : 'Rotate PDF'}
                </button>
            </div>

            <footer className={styles.footer}>
                <p>© 2026 tree.je — All rights reserved</p>
            </footer>
        </main>
    );
}

export default function PdfRotatePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PdfRotateContent />
        </Suspense>
    );
}
