'use client';

import { Suspense, useCallback, useState, useRef } from 'react';
import Link from 'next/link';
import styles from '../shared-tool.module.css';

function BulkImageConverterContent() {
    const [files, setFiles] = useState<File[]>([]);
    const [format, setFormat] = useState<'png' | 'jpg' | 'webp'>('png');
    const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
            if (newFiles.length === 0) {
                setErrorMsg('Please select image files.');
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
            const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            if (newFiles.length === 0) {
                setErrorMsg('Please drop image files.');
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

    const handleConvert = async () => {
        if (files.length === 0) {
            setErrorMsg('Please select images.');
            return;
        }

        setStatus('processing');
        setProgress(0);
        setErrorMsg('');

        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const img = new Image();
                img.src = URL.createObjectURL(file);
                await new Promise((resolve) => { img.onload = resolve; });

                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Canvas error');
                ctx.drawImage(img, 0, 0);

                const mime = format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';

                const blob = await new Promise<Blob | null>((resolve) => {
                    canvas.toBlob(resolve, mime, 0.9);
                });

                if (blob) {
                    const name = file.name.split('.')[0] + '.' + format;
                    zip.file(name, blob);
                }

                setProgress(Math.round(((i + 1) / files.length) * 100));
                URL.revokeObjectURL(img.src);
            }

            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `converted_images_${Date.now()}.zip`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 100);

            setStatus('done');
        } catch (err) {
            console.error(err);
            setErrorMsg('Failed to convert images.');
            setStatus('error');
        }
    };

    const triggerInput = () => inputRef.current?.click();

    return (
        <main className={styles.main}>
            <div className={styles.toolContainer}>
                <Link href="/" className={styles.backLink}>← Back to all tools</Link>

                <h1 className={styles.toolTitle}>Bulk Image Converter</h1>
                <p className={styles.toolDescription}>
                    Convert multiple images to JPG, PNG, or WEBP and download as ZIP.
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
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className={styles.fileInput}
                        aria-label="Select images"
                    />
                    <div className={styles.uploadVisual} aria-hidden />
                    <p className={styles.uploadText}>
                        Click to add images or drag and drop
                    </p>
                    <p className={styles.uploadHint}>Select multiple files</p>
                </div>

                {files.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>Selected Files ({files.length}):</h4>
                        <ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
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

                {files.length > 0 && (
                    <div className={styles.options}>
                        <div className={styles.optionGroup}>
                            <label>Target Format</label>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value as 'png' | 'jpg' | 'webp')}
                                className={styles.select}
                            >
                                <option value="png">PNG</option>
                                <option value="jpg">JPG</option>
                                <option value="webp">WEBP</option>
                            </select>
                        </div>
                    </div>
                )}

                {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}
                {status === 'processing' && <p style={{ marginBottom: '1rem' }}>Converting: {progress}%</p>}

                <button
                    className={styles.convertButton}
                    disabled={files.length === 0 || status === 'processing'}
                    onClick={handleConvert}
                >
                    {status === 'processing' ? 'Converting...' : 'Convert Images'}
                </button>
            </div>

            <footer className={styles.footer}>
                <p>© 2026 tree.je — All rights reserved</p>
            </footer>
        </main>
    );
}

export default function BulkImageConverterPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BulkImageConverterContent />
        </Suspense>
    );
}
