import React from "react";
import styles from "./BackgroundBlobs.module.css";

export default function BackgroundBlobs() {
  return (
    <>
      <div
        className={styles.blob1}
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(42,24,160,0.2), transparent 70%)",
        }}
      />
      <div
        className={styles.blob2}
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(155,0,25,0.22), transparent 70%)",
        }}
      />
    </>
  );
}
