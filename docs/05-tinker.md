# Tinker: Removing the Empty Submission Check

**Experiment Date:** 2026-06-08  
**File:** `src/components/ConfessionForm.jsx`

---

## Prediction

The submission is handled by `handleSubmit` in `ConfessionForm.jsx:12-17`. There are two mechanisms preventing empty submissions:

1. **Derived state check** (`ConfessionForm.jsx:9`): `isValid = trimmed.length > 0 && trimmed.length <= max`
2. **Disabled button** (`ConfessionForm.jsx:36`): `disabled={!isValid}` — this is what causes the mouse to become inactive on hover
3. **Guard clause** (`ConfessionForm.jsx:14`): `if (!isValid) return;`

If we remove the empty submission check:

- **Predicted behavior:** The "Confess" button will no longer be disabled when the textarea is empty. Hovering will work normally. Clicking submit with an empty confession will add a blank entry to the feed.
- **Predicted result in the feed:** An empty confession card will appear with no text content — just the timestamp and decorative elements.
- **Edge case:** The character counter will show `0 / 280` but submission will still go through.

---

## Code Change

Removed the `trimmed.length > 0` condition from `isValid`, allowing empty strings to pass validation:

```jsx
// Before:
const isValid = trimmed.length > 0 && trimmed.length <= max;

// After:
const isValid = trimmed.length <= max;
```

This single change ripples through both the button's `disabled` attribute and the `handleSubmit` guard clause, since both depend on `isValid`.

---

## Actual Result

**Confirmed — prediction was correct.** After the change:

1. The "Confess" button is now clickable even when the textarea is empty — hover and click both work normally.
2. Submitting a blank confession adds an empty card to the feed — only the timestamp and decorative elements render, with no text body visible.
3. The character counter shows `0 / 280` both before and after submission.
4. The keyboard shortcut (⌘+Enter) also submits the empty form successfully.

**Observation:** The feed entry renders without visible body content. Since `ConfessionFeed.jsx` renders `{item.text}`, an empty string produces a DOM node with no text — the card still appears but looks incomplete, with just the timestamp line and the decorative candle/divider visible.
