'use client';

import { Suspense, useCallback, useState, useRef } from 'react';
import Link from 'next/link';
import styles from '../shared-tool.module.css';

function PdfSplitContent() {
    const [file, setFile] = useState<File | null>(null);
    const [pageRange, setPageRange] = useState('');
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

    const parsePageRange = (rangeStr: string, maxPages: number): number[] => {
        const pages = new Set<number>();
        const parts = rangeStr.split(',');

        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.includes('-')) {
                const [start, end] = trimmed.split('-').map(Number);
                if (!isNaN(start) && !isNaN(end)) {
                    for (let i = start; i <= end; i++) {
                        if (i >= 1 && i <= maxPages) pages.add(i - 1); // 0-indexed
                    }
                }
            } else {
                const p = Number(trimmed);
                if (!isNaN(p) && p >= 1 && p <= maxPages) {
                    pages.add(p - 1);
                }
            }
        }
        return Array.from(pages).sort((a, b) => a - b);
    };

    const handleSplit = async () => {
        if (!file) return;
        if (!pageRange.trim()) {
            setErrorMsg('Please enter page numbers to extract.');
            return;
        }

        setStatus('processing');
        setErrorMsg('');

        try {
            const { PDFDocument } = await import('pdf-lib');
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const totalPages = pdf.getPageCount();

            const pageIndices = parsePageRange(pageRange, totalPages);

            if (pageIndices.length === 0) {
                setErrorMsg(`Invalid page range. The document has ${totalPages} pages.`);
                setStatus('idle');
                return;
            }

            const newPdf = await PDFDocument.create();
            const copiedPages = await newPdf.copyPages(pdf, pageIndices);
            copiedPages.forEach((page) => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `split_${file.name.replace('.pdf', '')}.pdf`;
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

                <h1 className={styles.toolTitle}>PDF Split</h1>
                <p className={styles.toolDescription}>
                    Extract selected pages from your PDF file.
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
                            <label htmlFor="pages">Pages to extract (e.g. 1, 3-5)</label>
                            <input
                                id="pages"
                                type="text"
                                placeholder="1, 3-5, 10"
                                value={pageRange}
                                onChange={(e) => setPageRange(e.target.value)}
                                className={styles.select} // Reusing select style for input
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                )}

                {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}

                <button
                    className={styles.convertButton}
                    disabled={!file || status === 'processing'}
                    onClick={handleSplit}
                >
                    {status === 'processing' ? 'Processing...' : 'Split PDF'}
                </button>
            </div>

            <footer className={styles.footer}>
                <p>© 2026 tree.je — All rights reserved</p>
            </footer>
        </main>
    );
}

export default function PdfSplitPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PdfSplitContent />
        </Suspense>
    );
}
