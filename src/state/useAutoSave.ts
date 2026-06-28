// Debounced auto-save: persists the latest state to storage after the user
// stops editing for `delay` ms. Driven by a monotonically increasing `signal`
// that callers bump on every user edit, so the timer resets while typing and
// initial hydration from context never triggers a write.

import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function saveStatusLabel(status: SaveStatus): string | null {
  switch (status) {
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "error":
      return "Save failed";
    default:
      return null;
  }
}

export function useDebouncedSave(signal: number, save: () => Promise<void>, delay = 800): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>("idle");
  // Keep the latest save closure without retriggering the debounce timer.
  const saveRef = useRef(save);
  saveRef.current = save;
  // Skip the very first run (initial mount / hydration).
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus("saving");
    const id = setTimeout(async () => {
      try {
        await saveRef.current();
        setStatus("saved");
      } catch {
        // persist() reloads on a concurrency conflict; surface as an error.
        setStatus("error");
      }
    }, delay);
    return () => clearTimeout(id);
  }, [signal, delay]);

  return status;
}

