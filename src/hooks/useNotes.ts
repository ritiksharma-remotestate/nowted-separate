import { useEffect, useState } from "react";
import type { Folder, Note, SpecialView } from "../types";
import * as notesApi from "../api/notesApi";
import { appendUnique, patchNote, upsertNote } from "../utils/notes";

const PAGE_SIZE = 10;

type Options = {
  selectedNoteId: string | null;
  specialView: SpecialView;
  refreshRecents: () => Promise<void>;
  onNoteLoadFailed: () => void;
};

export function useNotes({
  selectedNoteId,
  specialView,
  refreshRecents,
  onNoteLoadFailed,
}: Options) {
  const [notesList, setNotesList] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  useEffect(() => {
    notesApi
      .fetchNotesPage(1, PAGE_SIZE)
      .then(({ notes, total }) => {
        setNotesList(notes);
        setHasMore(
          total !== undefined ? notes.length < total : notes.length === PAGE_SIZE,
        );
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Something went wrong"),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (specialView !== "archived") return;

    notesApi
      .fetchArchivedNotes()
      .then((archived) => setNotesList((prev) => appendUnique(prev, archived)))
      .catch((err: unknown) => console.error("Archived error:", err));
  }, [specialView]);

  // Note detail: opened from a link, a refresh, or Recents
  useEffect(() => {
    if (loading || !selectedNoteId || specialView === "trash") return;

    const existing = notesList.find((n) => n.id === selectedNoteId);
    if (existing?.content !== undefined) return;

    notesApi
      .fetchNote(selectedNoteId)
      .then((full) => setNotesList((prev) => upsertNote(prev, full)))
      .catch((err: unknown) => {
        console.error("Failed to load note detail:", err);
        onNoteLoadFailed(); // bad id in the URL
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNoteId, specialView, loading]);

  const loadMore = async (): Promise<void> => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const { notes, total } = await notesApi.fetchNotesPage(nextPage, PAGE_SIZE);

      // dedupe: new/archived/restored notes can shift pages and repeat items
      setNotesList((prev) => appendUnique(prev, notes));
      setPage(nextPage);
      setHasMore(
        total !== undefined
          ? nextPage * PAGE_SIZE < total
          : notes.length === PAGE_SIZE,
      );
    } catch (err: unknown) {
      console.error("Failed to load more notes:", err);
    } finally {
      setLoadingMore(false);
    }
  };


  const createNote = async (folderId: string): Promise<Note | null> => {
    try {
      const note = await notesApi.createNote(folderId);
      refreshRecents();
      setNotesList((prev) => [note, ...prev]);
      return note;
    } catch (err: unknown) {
      console.error("Failed to create note:", err);
      alert("Couldn't create the note — check the console for details.");
      return null;
    }
  };

  const changeField = (field: "title" | "content", value: string): void => {
    setNotesList((prev) =>
      patchNote(prev, selectedNoteId ?? "", {
        [field]: value,
        ...(field === "content" ? { preview: value.slice(0, 50) } : {}),
      }),
    );
  };

  const saveNote = async (note: Note): Promise<void> => {
    try {
      await notesApi.updateNote(note.id, {
        title: note.title,
        content: note.content,
      });
      refreshRecents();
    } catch (err: unknown) {
      console.error("Failed to save note:", err);
    }
  };

  const deleteNote = async (id: string): Promise<boolean> => {
    try {
      await notesApi.deleteNote(id);
      refreshRecents();
      setNotesList((prev) => prev.filter((n) => n.id !== id));
      return true;
    } catch (err: unknown) {
      console.error("Delete error:", err);
      return false;
    }
  };

  const restoreNote = async (id: string): Promise<boolean> => {
    try {
      await notesApi.restoreNote(id);
      refreshRecents();
      const restored = await notesApi.fetchNote(id);
      setNotesList((prev) => upsertNote(prev, restored));
      return true;
    } catch (err: unknown) {
      console.error("Restore error:", err);
      return false;
    }
  };

  const toggleFavorite = async (note: Note): Promise<boolean> => {
    const isFavorite = !note.isFavorite;

    try {
      await notesApi.updateNote(note.id, { isFavorite });
      refreshRecents();
      setNotesList((prev) => patchNote(prev, note.id, { isFavorite }));
      return true;
    } catch (err: unknown) {
      console.error("Failed to update favorite:", err);
      return false;
    }
  };

  const toggleArchive = async (note: Note): Promise<boolean> => {
    const isArchived = !note.isArchived;

    try {
      await notesApi.updateNote(note.id, { isArchived });
      refreshRecents();
      setNotesList((prev) => patchNote(prev, note.id, { isArchived }));
      return true;
    } catch (err: unknown) {
      console.error("Failed to update archive:", err);
      return false;
    }
  };

  const changeFolder = async (
    noteId: string,
    folderId: string,
    folder: Folder | undefined,
  ): Promise<void> => {
    setNotesList((prev) => patchNote(prev, noteId, { folderId, folder }));

    try {
      await notesApi.updateNote(noteId, { folderId });
      refreshRecents();
    } catch (err: unknown) {
      console.error("Failed to change folder:", err);
    }
  };

  /* --------------------- keeping notes in sync with folders -------------------- */

  const renameFolderInNotes = (folderId: string, name: string): void => {
    setNotesList((prev) =>
      prev.map((n) =>
        n.folderId === folderId && n.folder
          ? { ...n, folder: { ...n.folder, name } }
          : n,
      ),
    );
  };

  // adjust to match what your backend does with a deleted folder's notes
  const removeNotesInFolder = (folderId: string): void => {
    setNotesList((prev) => prev.filter((n) => n.folderId !== folderId));
  };

  return {
    notesList,
    loading,
    error,
    hasMore,
    loadingMore,
    loadMore,
    createNote,
    changeField,
    saveNote,
    deleteNote,
    restoreNote,
    toggleFavorite,
    toggleArchive,
    changeFolder,
    renameFolderInNotes,
    removeNotesInFolder,
  };
}