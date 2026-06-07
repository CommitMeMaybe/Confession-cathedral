import React from "react";
import styles from "./ConfessionFeed.module.css";

export default function ConfessionFeed({ items }) {
  if (items.length === 0) {
    return (
      <p style={{ textAlign: "center", opacity: 0.5, marginTop: 24 }}>
        No confessions yet. Speak your truth.
      </p>
    );
  }

  return (
    <div className={styles.feed}>
      {items.map((item, i) => (
        <div key={i} className={styles.confessionItem}>
          <p className={styles.confessionText}>{item.text}</p>
          <p className={styles.timestamp}>
            {new Date(item.timestamp).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
