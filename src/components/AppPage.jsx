import React, { useCallback, useEffect, useRef, useState } from "react";
import ConfessionForm from "./ConfessionForm.jsx";
import ConfessionFeed from "./ConfessionFeed.jsx";
import styles from "./AppPage.module.css";

export default function AppPage({ onBack }) {
  const [confessions, setConfessions] = useState([]);
  const bgRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!bgRef.current) return;
    const rect = bgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    bgRef.current.style.setProperty('--mouse-x', `${x}%`);
    bgRef.current.style.setProperty('--mouse-y', `${y}%`);
  }, []);

  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const addConfession = (text) => {
    const timestamp = new Date().toISOString();
    setConfessions((prev) => [{ text, timestamp }, ...prev]);
  };

  return (
    <div className={styles.appPage}>
      <div className={styles.background} ref={bgRef}>
        <div className={styles.gradient1}></div>
        <div className={styles.gradient2}></div>
        <div className={styles.gradient3}></div>
        <div className={styles.gradient4}></div>
        <div className={styles.glow}></div>
      </div>

      <div className={styles.content}>
        <button className={styles.backButton} onClick={onBack}>
          <div className={styles.backIcon}></div>
          <span className={styles.backText}>The Cathedral</span>
        </button>

        <div className={styles.header}>
          <div className={styles.headerDivider}>
            <div className={styles.headerLineLeft}></div>
            <div className={styles.headerIcon}></div>
            <div className={styles.headerLineRight}></div>
          </div>

          <h1 className={styles.heading}>Confession Cathedral</h1>

          <p className={styles.subtitle}>Speak your truth. Leave no name.</p>

          <div className={styles.headerBottomDivider}>
            <div className={styles.headerBottomLineLeft}></div>
            <div className={styles.headerDot}></div>
            <div className={styles.headerBottomLineRight}></div>
          </div>
        </div>

        <div className={styles.formSection}>
          <ConfessionForm onSubmit={addConfession} />
        </div>

        {confessions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>The cathedral awaits your first confession.</p>
          </div>
        ) : (
          <ConfessionFeed items={confessions} />
        )}
      </div>
    </div>
  );
}
