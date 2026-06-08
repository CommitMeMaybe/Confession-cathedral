import React, { useState, useRef, useCallback } from "react";
import LandingPage from "./components/LandingPage.jsx";
import AppPage from "./components/AppPage.jsx";
import "./index.css";

export default function App() {
  const [currentPage, setCurrentPage] = useState("landing");
  const wormholeRef = useRef(0);
  const [wormholeActive, setWormholeActive] = useState(false);

  const handleEnterCathedral = useCallback(() => {
    setWormholeActive(true);
    const start = performance.now();
    const duration = 2000;

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      wormholeRef.current = t;
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        setCurrentPage("app");
      }
    };
    requestAnimationFrame(tick);
  }, []);

  const handleBackToLanding = useCallback(() => {
    setWormholeActive(false);
    wormholeRef.current = 0;
    setCurrentPage("landing");
  }, []);

  return (
    <>
      {currentPage === "landing" ? (
        <LandingPage
          onEnter={handleEnterCathedral}
          wormholeActive={wormholeActive}
          wormholeRef={wormholeRef}
        />
      ) : (
        <AppPage onBack={handleBackToLanding} />
      )}
    </>
  );
}
