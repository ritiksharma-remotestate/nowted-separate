import { useCallback, useEffect, useState } from "react";
import type { Note, SpecialView } from "../types";
import { fetchTrashNotes } from "../api/notesApi";

export function useTrashNotes(specialView: SpecialView) {
  const [trashNotes, setTrashNotes] = useState<Note[]>([]);

  useEffect(() => {
    if (specialView !== "trash") return;

    fetchTrashNotes()
      .then(setTrashNotes)
      .catch((err: unknown) => console.error("Trash error:", err));
  }, [specialView]);

  const removeFromTrash = useCallback((id: string) => {
    setTrashNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { trashNotes, removeFromTrash };
}