'use client';

import { Suspense, useCallback, useState, useRef } from 'react';
import Link from 'next/link';
import styles from '../shared-tool.module.css';

function ImageResizeContent() {
    const [file, setFile] = useState<File | null>(null);
    const [originalDimensions, setOriginalDimensions] = useState<{ width: number, height: number } | null>(null);
    const [width, setWidth] = useState<number | ''>('');
    const [height, setHeight] = useState<number | ''>('');
    const [percentage, setPercentage] = useState<number>(100);
    const [resizeMode, setResizeMode] = useState<'dimensions' | 'percentage'>('dimensions');
    const [maintainRatio, setMaintainRatio] = useState(true);
    const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f && f.type.startsWith('image/')) {
            const img = new Image();
            img.onload = () => {
                setOriginalDimensions({ width: img.width, height: img.height });
                setWidth(img.width);
                setHeight(img.height);
                setPercentage(100);
                setFile(f);
                setStatus('idle');
                setErrorMsg('');
            };
            img.onerror = () => {
                setErrorMsg('Invalid image file.');
            };
            img.src = URL.createObjectURL(f);
        } else if (f) {
            setFile(null);
            setErrorMsg('Please select an image file.');
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f && f.type.startsWith('image/')) {
            const img = new Image();
            img.onload = () => {
                setOriginalDimensions({ width: img.width, height: img.height });
                setWidth(img.width);
                setHeight(img.height);
                setPercentage(100);
                setFile(f);
                setStatus('idle');
                setErrorMsg('');
            };
            img.src = URL.createObjectURL(f);
        } else if (f) {
            setErrorMsg('Please drop an image file.');
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

    const handleWidthChange = (val: number) => {
        setWidth(val);
        if (maintainRatio && originalDimensions && val) {
            const ratio = originalDimensions.height / originalDimensions.width;
            setHeight(Math.round(val * ratio));
        }
    };

    const handleHeightChange = (val: number) => {
        setHeight(val);
        if (maintainRatio && originalDimensions && val) {
            const ratio = originalDimensions.width / originalDimensions.height;
            setWidth(Math.round(val * ratio));
        }
    };

    const handleResize = async () => {
        if (!file || !originalDimensions) return;
        setStatus('processing');

        try {
            let targetWidth: number;
            let targetHeight: number;

            if (resizeMode === 'percentage') {
                targetWidth = Math.round(originalDimensions.width * (percentage / 100));
                targetHeight = Math.round(originalDimensions.height * (percentage / 100));
            } else {
                targetWidth = Number(width);
                targetHeight = Number(height);
            }

            if (!targetWidth || !targetHeight) {
                setErrorMsg('Invalid dimensions');
                setStatus('idle');
                return;
            }

            const img = new Image();
            img.src = URL.createObjectURL(file);
            await new Promise((resolve) => { img.onload = resolve; });

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context failed');

            // Better quality scaling (simple step)
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `resized_${file.name}`;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 100);
                    setStatus('done');
                } else {
                    setErrorMsg('Resize failed.');
                    setStatus('error');
                }
            }, file.type);

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

                <h1 className={styles.toolTitle}>Image Resize</h1>
                <p className={styles.toolDescription}>
                    Resize your images by pixel dimensions or percentage.
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
                        {file ? `${file.name} (${originalDimensions?.width}x${originalDimensions?.height})` : 'Click to select image or drag and drop'}
                    </p>
                </div>

                {file && (
                    <div className={styles.options}>
                        <div className={styles.optionGroup}>
                            <label>Resize By</label>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                                <label>
                                    <input
                                        type="radio"
                                        name="mode"
                                        value="dimensions"
                                        checked={resizeMode === 'dimensions'}
                                        onChange={() => setResizeMode('dimensions')}
                                    /> Dimensions (px)
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="mode"
                                        value="percentage"
                                        checked={resizeMode === 'percentage'}
                                        onChange={() => setResizeMode('percentage')}
                                    /> Percentage (%)
                                </label>
                            </div>
                        </div>

                        {resizeMode === 'dimensions' ? (
                            <>
                                <div className={styles.optionGroup}>
                                    <label>Width (px)</label>
                                    <input
                                        type="number"
                                        className={styles.select}
                                        value={width}
                                        onChange={(e) => handleWidthChange(Number(e.target.value))}
                                    />
                                </div>
                                <div className={styles.optionGroup}>
                                    <label>Height (px)</label>
                                    <input
                                        type="number"
                                        className={styles.select}
                                        value={height}
                                        onChange={(e) => handleHeightChange(Number(e.target.value))}
                                    />
                                </div>
                                <div className={styles.optionGroup}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={maintainRatio}
                                            onChange={(e) => setMaintainRatio(e.target.checked)}
                                        /> Maintain Aspect Ratio
                                    </label>
                                </div>
                            </>
                        ) : (
                            <div className={styles.optionGroup}>
                                <label>Percentage ({percentage}%)</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="200"
                                    step="1"
                                    value={percentage}
                                    onChange={(e) => setPercentage(Number(e.target.value))}
                                    className={styles.select}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}

                <button
                    className={styles.convertButton}
                    disabled={!file || status === 'processing'}
                    onClick={handleResize}
                >
                    {status === 'processing' ? 'Processing...' : 'Resize Image'}
                </button>
            </div>

            <footer className={styles.footer}>
                <p>© 2026 tree.je — All rights reserved</p>
            </footer>
        </main>
    );
}

export default function ImageResizePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ImageResizeContent />
        </Suspense>
    );
}
