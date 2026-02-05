'use client';

import { Suspense, useCallback, useState, useRef } from 'react';
import Link from 'next/link';
import styles from '../shared-tool.module.css';

function PdfMergeContent() {
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
            if (newFiles.length === 0) {
                setErrorMsg('Please select PDF files.');
                return;
            }
            setFiles(prev => [...prev, ...newFiles]);
            setStatus('idle');
            setErrorMsg('');
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
            if (newFiles.length === 0) {
                setErrorMsg('Please drop PDF files.');
                return;
            }
            setFiles(prev => [...prev, ...newFiles]);
            setStatus('idle');
            setErrorMsg('');
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            setErrorMsg('Please select at least 2 PDF files to merge.');
            return;
        }

        setStatus('processing');
        setErrorMsg('');

        try {
            const { PDFDocument } = await import('pdf-lib');
            const mergedPdf = await PDFDocument.create();

            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const pdfBytes = await mergedPdf.save();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `merged_${Date.now()}.pdf`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 100);

            setStatus('done');
        } catch (err) {
            console.error(err);
            setErrorMsg('Failed to merge PDFs. One of the files might be corrupted.');
            setStatus('error');
        }
    };

    const triggerInput = () => inputRef.current?.click();

    return (
        <main className={styles.main}>
            <div className={styles.toolContainer}>
                <Link href="/" className={styles.backLink}>← Back to all tools</Link>

                <h1 className={styles.toolTitle}>PDF Merge</h1>
                <p className={styles.toolDescription}>
                    Combine multiple specific PDF files into a single document.
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
                        multiple
                        onChange={handleFileChange}
                        className={styles.fileInput}
                        aria-label="Select PDF files"
                    />
                    <div className={styles.uploadVisual} aria-hidden />
                    <p className={styles.uploadText}>
                        Click to add PDFs or drag and drop
                    </p>
                    <p className={styles.uploadHint}>Select multiple files</p>
                </div>

                {files.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>Selected Files ({files.length}):</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {files.map((file, index) => (
                                <li key={index} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '0.5rem',
                                    backgroundColor: 'var(--color-surface)',
                                    marginBottom: '0.25rem',
                                    borderRadius: '4px',
                                    border: '1px solid var(--color-border)'
                                }}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                                        {file.name}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                    >
                                        ×
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}

                <button
                    className={styles.convertButton}
                    disabled={files.length < 2 || status === 'processing'}
                    onClick={handleMerge}
                >
                    {status === 'processing' ? 'Merging...' : 'Merge PDFs'}
                </button>
            </div>

            <footer className={styles.footer}>
                <p>© 2026 tree.je — All rights reserved</p>
            </footer>
        </main>
    );
}

export default function PdfMergePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PdfMergeContent />
        </Suspense>
    );
}
