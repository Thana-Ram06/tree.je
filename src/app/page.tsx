'use client';

import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Simple, private file conversion.</h1>
        <p className={styles.heroSubtext}>
          All conversions happen locally in your browser. No uploads, no tracking, complete privacy.
        </p>
        <button className={styles.ctaButton}>Choose file</button>
      </section>

      {/* PDF Tools Section */}
      <section className={styles.toolsSection}>
        <h2 className={styles.sectionTitle}>PDF Tools</h2>
        <div className={styles.toolsGrid}>
          {/* Existing PDF Tools */}
          <Link href="/tools/pdf-to-image" className={styles.toolCard}>
            <h3>PDF to Image</h3>
            <p>Convert PDF pages to JPG or PNG</p>
          </Link>

          <Link href="/tools/pdf-to-png" className={styles.toolCard}>
            <h3>PDF to PNG</h3>
            <p>Convert PDF to high-quality PNG</p>
          </Link>

          <Link href="/tools/pdf-to-jpg" className={styles.toolCard}>
            <h3>PDF to JPG</h3>
            <p>Convert PDF pages to JPG images</p>
          </Link>

          <Link href="/tools/image-to-pdf" className={styles.toolCard}>
            <h3>Image to PDF</h3>
            <p>Convert images to PDF format</p>
          </Link>

          <Link href="/tools/txt-to-pdf" className={styles.toolCard}>
            <h3>TXT to PDF</h3>
            <p>Convert text files to PDF</p>
          </Link>

          <Link href="/tools/html-to-pdf" className={styles.toolCard}>
            <h3>HTML to PDF</h3>
            <p>Convert HTML content to PDF</p>
          </Link>

          {/* New PDF Tools */}
          <Link href="/tools/pdf-merge" className={styles.toolCard}>
            <h3>PDF Merge</h3>
            <p>Combine multiple PDFs into one</p>
          </Link>

          <Link href="/tools/pdf-split" className={styles.toolCard}>
            <h3>PDF Split</h3>
            <p>Extract specific pages from PDF</p>
          </Link>

          <Link href="/tools/pdf-rotate" className={styles.toolCard}>
            <h3>PDF Rotate</h3>
            <p>Rotate pages 90°, 180°, or 270°</p>
          </Link>

          <Link href="/tools/pdf-delete-pages" className={styles.toolCard}>
            <h3>Delete Pages</h3>
            <p>Remove selected pages from PDF</p>
          </Link>
        </div>
      </section>

      {/* Image Tools Section */}
      <section className={styles.toolsSection}>
        <h2 className={styles.sectionTitle}>Image Tools</h2>
        <div className={styles.toolsGrid}>
          {/* Existing Image Tools */}
          <Link href="/tools/jpg-to-png" className={styles.toolCard}>
            <h3>JPG to PNG</h3>
            <p>Convert JPG images to PNG</p>
          </Link>

          <Link href="/tools/png-to-jpg" className={styles.toolCard}>
            <h3>PNG to JPG</h3>
            <p>Convert PNG images to JPG</p>
          </Link>

          <Link href="/tools/jpg-to-webp" className={styles.toolCard}>
            <h3>JPG to WEBP</h3>
            <p>Convert JPG to modern WEBP</p>
          </Link>

          <Link href="/tools/png-to-webp" className={styles.toolCard}>
            <h3>PNG to WEBP</h3>
            <p>Convert PNG to modern WEBP</p>
          </Link>

          <Link href="/tools/webp-converter" className={styles.toolCard}>
            <h3>WEBP Converter</h3>
            <p>Convert WEBP to JPG or PNG</p>
          </Link>

          <Link href="/tools/svg-to-png" className={styles.toolCard}>
            <h3>SVG to PNG</h3>
            <p>Convert vector SVG to PNG</p>
          </Link>

          {/* New Image Tools */}
          <Link href="/tools/image-resize" className={styles.toolCard}>
            <h3>Image Resize</h3>
            <p>Resize by width, height, or %</p>
          </Link>

          <Link href="/tools/image-compress" className={styles.toolCard}>
            <h3>Image Compress</h3>
            <p>Reduce image size efficiently</p>
          </Link>

          <Link href="/tools/image-crop" className={styles.toolCard}>
            <h3>Image Crop</h3>
            <p>Crop images with precision</p>
          </Link>

          <Link href="/tools/bulk-image-converter" className={styles.toolCard}>
            <h3>Bulk Converter</h3>
            <p>Convert multiple images at once</p>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <h2 className={styles.featuresTitle}>Why tree.je</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <h3>Secure & privacy-first</h3>
            <p>Your files are processed only on your device.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>No login required</h3>
            <p>Use tools instantly without any account.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>No file uploads</h3>
            <p>Everything runs locally in your browser.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Fast & lightweight</h3>
            <p>Quick conversions on modern devices.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <span className={styles.footerText}>
            © 2026 tree.je — All rights reserved
          </span>

          <div className={styles.footerBy}>
            <span>Made by me</span>
            <a
              href="https://x.com/anoinv?s=21"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow on X"
              className={styles.footerX}
            >
              <XIcon />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2H21.49L14.36 10.17L22.75 22H16.17L11.1 14.93L5.27 22H2.02L9.64 13.3L1.6 2H8.34L12.9 8.3L18.244 2Z" />
  </svg>
);
