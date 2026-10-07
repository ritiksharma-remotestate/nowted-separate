import type { Note, SpecialView } from "../types";

export const appendUnique = (prev: Note[], incoming: Note[]): Note[] => {
  const ids = new Set(prev.map((n) => n.id));
  return [...prev, ...incoming.filter((n) => !ids.has(n.id))];
};

// merge into the existing note, or add it to the top if it isn't loaded yet
export const upsertNote = (prev: Note[], note: Note): Note[] =>
  prev.some((n) => n.id === note.id)
    ? prev.map((n) => (n.id === note.id ? { ...n, ...note } : n))
    : [note, ...prev];

export const patchNote = (
  prev: Note[],
  id: string,
  patch: Partial<Note>,
): Note[] => prev.map((n) => (n.id === id ? { ...n, ...patch } : n));

type FilterOptions = {
  notes: Note[];
  folderId: string | null;
  specialView: SpecialView;
  search: string;
};

export function filterNotes({
  notes,
  folderId,
  specialView,
  search,
}: FilterOptions): Note[] {
  const q = search.trim().toLowerCase();

  return notes.filter((n) => {
    const matchesFolder = !folderId || n.folderId === folderId;

    const matchesSpecialView =
      (specialView === null && !n.isArchived) ||
      (specialView === "favorites" && n.isFavorite === true && !n.isArchived) ||
      specialView === "trash" ||
      (specialView === "archived" && n.isArchived === true);

    const matchesSearch =
      q === "" ||
      n.title.toLowerCase().includes(q) ||
      (n.preview ?? "").toLowerCase().includes(q);

    return matchesFolder && matchesSpecialView && matchesSearch;
  });
}