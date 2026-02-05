'use client';

import { Suspense, useCallback, useState, useRef } from 'react';
import Link from 'next/link';
import styles from '../shared-tool.module.css';

function PdfDeletePagesContent() {
    const [file, setFile] = useState<File | null>(null);
    const [pagesToDelete, setPagesToDelete] = useState('');
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

    const parsePages = (str: string, maxPages: number): number[] => {
        const pages = new Set<number>();
        const parts = str.split(',');
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [start, end] = trimmed.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) {
                        if (i >= 1 && i <= maxPages) pages.add(i - 1);
                    }
                }
            } else {
                const p = Number(trimmed);
                if (!isNaN(p) && p >= 1 && p <= maxPages) {
                    pages.add(p - 1);
                }
            }
        }
        return Array.from(pages);
    };

    const handleDelete = async () => {
        if (!file) return;
        if (!pagesToDelete.trim()) {
            setErrorMsg('Please enter page numbers to delete.');
            return;
        }

        setStatus('processing');
        setErrorMsg('');

        try {
            const { PDFDocument } = await import('pdf-lib');
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const totalPages = pdf.getPageCount();

            const formatIndices = parsePages(pagesToDelete, totalPages);

            if (formatIndices.length === 0) {
                setErrorMsg(`Invalid page range. Document has ${totalPages} pages.`);
                setStatus('idle');
                return;
            }

            // Identify pages to KEEP: All pages NOT in formatIndices
            // Actually pdf-lib `removePage` shifts indices, so it is better to create a new PDF and copy only the pages we want to KEEP.
            // Or we can delete from end to start.

            // Let's create new PDF and copy keepers.
            const keeperIndices = [];
            for (let i = 0; i < totalPages; i++) {
                if (!formatIndices.includes(i)) {
                    keeperIndices.push(i);
                }
            }

            if (keeperIndices.length === 0) {
                setErrorMsg('You cannot delete all pages.');
                setStatus('idle');
                return;
            }

            const newPdf = await PDFDocument.create();
            const copiedPages = await newPdf.copyPages(pdf, keeperIndices);
            copiedPages.forEach((page) => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `deleted_pages_${file.name}`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 100);

            setStatus('done');
        } catch (err) {
            console.error(err);
            setErrorMsg('Failed to process PDF.');
            setStatus('error');
        }
    };

    const triggerInput = () => inputRef.current?.click();

    return (
        <main className={styles.main}>
            <div className={styles.toolContainer}>
                <Link href="/" className={styles.backLink}>← Back to all tools</Link>

                <h1 className={styles.toolTitle}>Delete Pages</h1>
                <p className={styles.toolDescription}>
                    Remove specific pages from your PDF file.
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
                            <label htmlFor="deletePages">Pages to delete (e.g. 2, 5-7)</label>
                            <input
                                id="deletePages"
                                type="text"
                                value={pagesToDelete}
                                onChange={(e) => setPagesToDelete(e.target.value)}
                                placeholder="2, 5-7"
                                className={styles.select}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                )}

                {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}

                <button
                    className={styles.convertButton}
                    disabled={!file || status === 'processing'}
                    onClick={handleDelete}
                >
                    {status === 'processing' ? 'Processing...' : 'Delete Pages'}
                </button>
            </div>

            <footer className={styles.footer}>
                <p>© 2026 tree.je — All rights reserved</p>
            </footer>
        </main>
    );
}

export default function PdfDeletePagesPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PdfDeletePagesContent />
        </Suspense>
    );
}
