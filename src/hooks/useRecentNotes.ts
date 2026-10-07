import { useCallback, useEffect, useState } from "react";
import type { Note } from "../types";
import { fetchRecentNotes } from "../api/notesApi";

export function useRecentNotes() {
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);

  const refreshRecents = useCallback(async (): Promise<void> => {
    try {
      const notes = await fetchRecentNotes();
      setRecentNotes(notes.slice(0, 3));
    } catch (err: unknown) {
      console.error("Failed to load recent notes:", err);
    }
  }, []);

  useEffect(() => {
    refreshRecents();
  }, [refreshRecents]);

  return { recentNotes, refreshRecents };
}