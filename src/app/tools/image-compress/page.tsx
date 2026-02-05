'use client';

import { Suspense, useCallback, useState, useRef } from 'react';
import Link from 'next/link';
import styles from '../shared-tool.module.css';

function ImageCompressContent() {
    const [file, setFile] = useState<File | null>(null);
    const [quality, setQuality] = useState<number>(0.8);
    const [format, setFormat] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');
    const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f && f.type.startsWith('image/')) {
            setFile(f);
            setPreviewUrl(URL.createObjectURL(f));
            setStatus('idle');
            setErrorMsg('');
            if (f.type === 'image/webp') setFormat('image/webp');
            else setFormat('image/jpeg'); // Default to JPEG for compression if input is not webp
        } else if (f) {
            setFile(null);
            setErrorMsg('Please select an image file.');
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f && f.type.startsWith('image/')) {
            setFile(f);
            setPreviewUrl(URL.createObjectURL(f));
            setStatus('idle');
            setErrorMsg('');
            if (f.type === 'image/webp') setFormat('image/webp');
            else setFormat('image/jpeg');
        } else if (f) {
            setErrorMsg('Please drop an image file.');
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

    const handleCompress = async () => {
        if (!file) return;
        setStatus('processing');

        try {
            const img = new Image();
            img.src = previewUrl!;
            await new Promise((resolve) => { img.onload = resolve; });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context failed');

            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    // Determine extension
                    const ext = format === 'image/jpeg' ? 'jpg' : 'webp';
                    a.download = `compressed_${file.name.split('.')[0]}.${ext}`;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 100);
                    setStatus('done');
                } else {
                    setErrorMsg('Compression failed.');
                    setStatus('error');
                }
            }, format, quality);

        } catch (err) {
            console.error(err);
            setErrorMsg('Processing failed.');
            setStatus('error');
        }
    };

    const triggerInput = () => inputRef.current?.click();

    return (
        <main className={styles.main}>
            <div className={styles.toolContainer}>
                <Link href="/" className={styles.backLink}>← Back to all tools</Link>

                <h1 className={styles.toolTitle}>Image Compress</h1>
                <p className={styles.toolDescription}>
                    Reduce image file size with adjustable quality.
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
                        onChange={handleFileChange}
                        className={styles.fileInput}
                        aria-label="Select image file"
                    />
                    <div className={styles.uploadVisual} aria-hidden />
                    <p className={styles.uploadText}>
                        {file ? file.name : 'Click to select image or drag and drop'}
                    </p>
                </div>

                {file && (
                    <div className={styles.options}>
                        <div className={styles.optionGroup}>
                            <label>Compression Quality ({Math.round(quality * 100)}%)</label>
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.05"
                                value={quality}
                                onChange={(e) => setQuality(Number(e.target.value))}
                                className={styles.select}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className={styles.optionGroup}>
                            <label>Output Format</label>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value as 'image/jpeg' | 'image/webp')}
                                className={styles.select}
                            >
                                <option value="image/jpeg">JPG</option>
                                <option value="image/webp">WEBP</option>
                            </select>
                        </div>
                    </div>
                )}

                {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}

                <button
                    className={styles.convertButton}
                    disabled={!file || status === 'processing'}
                    onClick={handleCompress}
                >
                    {status === 'processing' ? 'Compressing...' : 'Compress Image'}
                </button>
            </div>

            <footer className={styles.footer}>
                <p>© 2026 tree.je — All rights reserved</p>
            </footer>
        </main>
    );
}

export default function ImageCompressPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ImageCompressContent />
        </Suspense>
    );
}
