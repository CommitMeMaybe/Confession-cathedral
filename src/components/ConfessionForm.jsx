import React, { useState } from "react";
import styles from "./ConfessionForm.module.css";

export default function ConfessionForm({ onSubmit }) {
  const max = 280;
  const [value, setValue] = useState("");

  const trimmed = value.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= max;

  const handleChange = (e) => setValue(e.target.value);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formContainer}>
        <div className={styles.formTopDivider}></div>
        <textarea
          className={styles.textarea}
          placeholder="What weighs upon your soul…"
          value={value}
          onChange={handleChange}
          maxLength={max + 50}
        />
        <div className={styles.formFooter}>
          <span
            className={`${styles.counter} ${value.length > max ? styles.error : ""}`}
          >
            {value.length} / {max}
          </span>
          <button type="submit" className={styles.button} disabled={!isValid}>
            Confess
          </button>
        </div>
      </div>
      <p className={styles.keyboardHint}>⌘ + Enter to submit</p>
    </form>
  );
}
