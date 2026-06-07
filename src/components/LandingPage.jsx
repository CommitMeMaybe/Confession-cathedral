import React, { useCallback, useEffect, useRef } from 'react';
import styles from './LandingPage.module.css';
import PsychedelicBackground from './PsychedelicBackground';

export default function LandingPage({ onEnter, wormholeActive, wormholeRef }) {
  // Reference to the container for CSS variable glow effect
  const bgRef = useRef(null);
  // Shared mouse position (normalized 0‑1) used by both CSS glow and the 3D shader
  const mousePosRef = useRef({ x: 0.5, y: 0.5 });

  // Track mouse movement – we deliberately apply a small easing so the pattern lags behind the cursor
  const handleMouseMove = useCallback((e) => {
    if (!bgRef.current) return;
    const rect = bgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const rawY = (e.clientY - rect.top) / rect.height;
    const y = 1.0 - rawY;
    mousePosRef.current.x = x;
    mousePosRef.current.y = y;
    const pctX = x * 100;
    const pctY = rawY * 100;
    bgRef.current.style.setProperty('--mouse-x', `${pctX}%`);
    bgRef.current.style.setProperty('--mouse-y', `${pctY}%`);
  }, []);

  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
    <div className={`${styles.landingPage} ${wormholeActive ? styles.wormhole : ''}`}>
      <div className={styles.background} ref={bgRef}>
        {/* Three‑JS background – receives the live mouse reference */}
        <PsychedelicBackground mousePosRef={mousePosRef} wormholeRef={wormholeRef} />
        <div className={styles.gradient1}></div>
        <div className={styles.gradient2}></div>
        <div className={styles.gradient3}></div>
        <div className={styles.gradient4}></div>
        <div className={styles.gradient5}></div>
        <div className={styles.gradient6}></div>
        <div className={styles.gradient7}></div>
        <div className={styles.glow}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.iconContainer}>
          <div className={styles.lineLeft}></div>
          <div className={styles.icon}></div>
          <div className={styles.lineRight}></div>
        </div>

        <h1 className={styles.heading}>
          <span>Confession</span>
          <span>Cathedral</span>
        </h1>

        <div className={styles.dividerContainer}>
          <div className={styles.divider}></div>
        </div>

        <p className={styles.tagline}>
          No name. No account. No judgement.
          Just your truth, offered in the dark.
        </p>

        <button className={styles.enterButton} onClick={onEnter}>
          Enter the Cathedral
        </button>

        <p className={styles.subtitle}>
          Anonymous · Ephemeral · No account required
        </p>

        <div className={styles.scrollIndicator}>
          <div className={styles.scrollLine}></div>
          <div className={styles.scrollDot}></div>
        </div>
      </div>
    </div>
  );
}
