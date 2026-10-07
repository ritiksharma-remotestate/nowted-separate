import type { Note, NotesResponse } from "../types";
import { getJson, sendJson, sendPlain } from "./client";

type NoteResponse = Note | { note: Note };

export type NotesPage = { notes: Note[]; total?: number };

export type NotePatch = Partial<
  Pick<Note, "title" | "content" | "isFavorite" | "isArchived" | "folderId">
>;

const unwrapNote = (data: NoteResponse): Note =>
  "note" in data ? data.note : data;

const listOf = (data: Note[] | NotesResponse): Note[] =>
  Array.isArray(data) ? data : (data.notes ?? data.data ?? []);

export async function fetchNotesPage(
  page: number,
  limit: number,
): Promise<NotesPage> {
  const data = await getJson<Note[] | NotesResponse>(
    `/notes?page=${page}&limit=${limit}`,
  );

  return {
    notes: listOf(data),
    total: Array.isArray(data) ? undefined : data.total,
  };
}

export async function fetchTrashNotes(): Promise<Note[]> {
  return listOf(await getJson<Note[] | NotesResponse>("/notes?deleted=true"));
}

export async function fetchArchivedNotes(): Promise<Note[]> {
  return listOf(
    await getJson<Note[] | NotesResponse>("/notes?archived=true&limit=100"),
  );
}

export async function fetchRecentNotes(): Promise<Note[]> {
  const data = await getJson<Note[] | NotesResponse>("/notes/recent");
  return Array.isArray(data) ? data : (data.recentNotes ?? data.data ?? []);
}

export async function fetchNote(id: string): Promise<Note> {
  return unwrapNote(await getJson<NoteResponse>(`/notes/${id}`));
}

export async function createNote(folderId: string): Promise<Note> {
  const res = await sendJson("/notes", "POST", {
    folderId,
    title: "Untitled Note",
    content: "Start writing here...",
  });

  return unwrapNote(await res.json());
}

export async function updateNote(id: string, patch: NotePatch): Promise<void> {
  await sendJson(`/notes/${id}`, "PATCH", patch);
}

export async function deleteNote(id: string): Promise<void> {
  await sendPlain(`/notes/${id}`, "DELETE");
}

export async function restoreNote(id: string): Promise<void> {
  await sendPlain(`/notes/${id}/restore`, "POST");
}