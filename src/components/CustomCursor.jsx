import React, { useEffect, useState } from "react";

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const move = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: 0,
        height: 0,
        zIndex: 9999,
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
      }}
    >
      <svg
        width="28"
        height="36"
        viewBox="0 0 28 36"
        fill="none"
        style={{ display: "block" }}
      >
        <defs>
          <filter id="crossGlow">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#9b0020" floodOpacity="0.5"/>
          </filter>
        </defs>
        <g filter="url(#crossGlow)" stroke="#f0e4d0" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M14 1v12m0 0v22m0-22H1m13 0h13"
            strokeWidth="3"
          />
          <path
            d="M8 4.5 14 1l6 3.5M8 31.5l6 3.5 6-3.5"
            strokeWidth="2"
          />
          <path
            d="M3 13l-2-3 2-3M25 13l2-3-2-3"
            strokeWidth="2"
          />
          <circle cx="14" cy="15" r="1.5" fill="#9b0020" stroke="none" />
        </g>
      </svg>
    </div>
  );
}
