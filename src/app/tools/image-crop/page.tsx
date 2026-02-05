'use client';

import { Suspense, useCallback, useState, useRef } from 'react';
import Link from 'next/link';
import styles from '../shared-tool.module.css';

function ImageCropContent() {
    const [file, setFile] = useState<File | null>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    // Crop state
    const [isDragging, setIsDragging] = useState(false);
    const [selection, setSelection] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [startPos, setStartPos] = useState<{ x: number, y: number } | null>(null);

    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f && f.type.startsWith('image/')) {
            setFile(f);
            setImgSrc(URL.createObjectURL(f));
            setSelection(null);
            setStatus('idle');
            setErrorMsg('');
        } else if (f) {
            setFile(null);
            setErrorMsg('Please select an image file.');
        }
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!imgRef.current) return;
        e.preventDefault();
        const rect = imgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartPos({ x, y });
        setSelection({ x, y, w: 0, h: 0 });
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !startPos || !imgRef.current) return;
        e.preventDefault();
        const rect = imgRef.current.getBoundingClientRect();
        const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

        const x = Math.min(currentX, startPos.x);
        const y = Math.min(currentY, startPos.y);
        const w = Math.abs(currentX - startPos.x);
        const h = Math.abs(currentY - startPos.y);

        setSelection({ x, y, w, h });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleCrop = async () => {
        if (!file || !selection || !imgRef.current) return;
        if (selection.w < 5 || selection.h < 5) return; // Ignore tiny selections

        setStatus('processing');

        try {
            const img = new Image();
            img.src = imgSrc!;
            await new Promise((resolve) => { img.onload = resolve; });

            // Calculate scale factor (natural size vs displayed size)
            const scaleX = img.naturalWidth / imgRef.current.width;
            const scaleY = img.naturalHeight / imgRef.current.height;

            const canvas = document.createElement('canvas');
            canvas.width = selection.w * scaleX;
            canvas.height = selection.h * scaleY;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context failed');

            ctx.drawImage(
                img,
                selection.x * scaleX,
                selection.y * scaleY,
                selection.w * scaleX,
                selection.h * scaleY,
                0,
                0,
                canvas.width,
                canvas.height
            );

            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `cropped_${file.name}`;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 100);
                    setStatus('done');
                } else {
                    setErrorMsg('Crop failed.');
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

                <h1 className={styles.toolTitle}>Image Crop</h1>
                <p className={styles.toolDescription}>
                    Select and crop a part of your image.
                </p>

                {!file ? (
                    <div
                        className={styles.uploadArea}
                        onClick={triggerInput}
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
                            Click to select image to crop
                        </p>
                    </div>
                ) : (
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p>Click and drag to select area. </p>
                            <button onClick={() => setFile(null)} className={styles.backLink} style={{ margin: 0 }}>Choose different image</button>
                        </div>

                        <div
                            ref={containerRef}
                            style={{ position: 'relative', display: 'inline-block', overflow: 'hidden', userSelect: 'none', touchAction: 'none', maxWidth: '100%' }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            <img
                                ref={imgRef}
                                src={imgSrc!}
                                alt="Crop target"
                                draggable={false}
                                style={{ maxWidth: '100%', display: 'block', maxHeight: '600px' }}
                            />
                            {selection && (
                                <div style={{
                                    position: 'absolute',
                                    border: '2px solid #fff',
                                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                                    left: selection.x,
                                    top: selection.y,
                                    width: selection.w,
                                    height: selection.h,
                                    pointerEvents: 'none'
                                }} />
                            )}
                        </div>
                    </div>
                )}

                {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}

                <button
                    className={styles.convertButton}
                    disabled={!file || !selection || status === 'processing'}
                    onClick={handleCrop}
                >
                    {status === 'processing' ? 'Cropping...' : 'Crop & Download'}
                </button>
            </div>

            <footer className={styles.footer}>
                <p>© 2026 tree.je — All rights reserved</p>
            </footer>
        </main>
    );
}

export default function ImageCropPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ImageCropContent />
        </Suspense>
    );
}
