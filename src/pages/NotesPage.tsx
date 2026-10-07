import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import NotesList from "../components/NotesList/NotesList";
import NoteEditor from "../components/NoteEditor/NoteEditor";
import RestoreNote from "../components/RestoreNote/RestoreNote";
import EmptyState from "../components/EmptyState/EmptyState";
import type { Note } from "../types";
import { useTheme } from "../context/themeContext";
import { useRoute } from "../context/routeContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useRecentNotes } from "../hooks/useRecentNotes";
import { useFolders } from "../hooks/useFolders";
import { useTrashNotes } from "../hooks/useTrashNotes";
import { useNotes } from "../hooks/useNotes";
import { filterNotes } from "../utils/notes";

function NotesPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { selectedNoteId, selectedFolderId, specialView, basePath } =
    useRoute();

  // UI-only state
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [showAddFolder, setShowAddFolder] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  // data
  const { recentNotes, refreshRecents } = useRecentNotes();
  const foldersState = useFolders();
  const { folders } = foldersState;
  const { trashNotes, removeFromTrash } = useTrashNotes(specialView);
  const notes = useNotes({
    selectedNoteId,
    specialView,
    refreshRecents,
    onNoteLoadFailed: () => navigate(basePath || "/", { replace: true }),
  });

  // derived
  const isLoading = notes.loading || foldersState.loading;
  const loadError = notes.error ?? foldersState.error;
  const showRestore = specialView === "trash" && selectedNoteId !== null;
  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? null;

  const sourceNotes = specialView === "trash" ? trashNotes : notes.notesList;
  const selectedNote = sourceNotes.find((n) => n.id === selectedNoteId);

  const visibleNotes = filterNotes({
    notes: sourceNotes,
    folderId: selectedFolderId,
    specialView,
    search: debouncedSearch,
  });

  const closeNote = (): void | Promise<void> => navigate(basePath || "/");


  const handleSelectNote = (note: Note): void => {
    setShowMenu(false);

    if (selectedNoteId === note.id) {
      closeNote();
      return;
    }

    navigate(`${basePath}/notes/${note.id}`);
  };

  const handleAddFolder = async (): Promise<void> => {
    const trimmed = newFolderName.trim();
    if (trimmed === "") return;

    if (await foldersState.addFolder(trimmed)) {
      setNewFolderName("");
      setShowAddFolder(false);
    }
  };

  const handleRenameFolder = async (
    folderId: string,
    name: string,
  ): Promise<void> => {
    if (await foldersState.renameFolder(folderId, name)) {
      notes.renameFolderInNotes(folderId, name);
    }
  };

  const handleDeleteFolder = async (folderId: string): Promise<void> => {
    if (!(await foldersState.deleteFolder(folderId))) return;

    notes.removeNotesInFolder(folderId);

    if (selectedFolderId === folderId || selectedNote?.folderId === folderId) {
      navigate("/");
    }

    refreshRecents();
  };

  const handleNewNote = async (): Promise<void> => {
    const defaultFolderId = folders[0]?.id;

    if (!defaultFolderId) {
      alert("Create a folder first — notes need to belong to one.");
      return;
    }

    const created = await notes.createNote(defaultFolderId);
    if (created) navigate(`/notes/${created.id}`);
  };

  const handleSaveNote = async (): Promise<void> => {
    if (selectedNote) await notes.saveNote(selectedNote);
  };

  const handleDeleteNote = async (): Promise<void> => {
    if (!selectedNote) return;

    if (await notes.deleteNote(selectedNote.id)) {
      setShowMenu(false);
      closeNote();
    }
  };

  const handleRestoreNote = async (noteId: string): Promise<void> => {
    if (await notes.restoreNote(noteId)) {
      removeFromTrash(noteId);
      navigate("/trash");
    }
  };

  const handleToggleFavorite = async (): Promise<void> => {
    if (selectedNote && (await notes.toggleFavorite(selectedNote))) {
      setShowMenu(false);
    }
  };

  const handleToggleArchive = async (): Promise<void> => {
    if (selectedNote && (await notes.toggleArchive(selectedNote))) {
      setShowMenu(false);
      closeNote(); // the note just left this list
    }
  };

  const handleChangeFolder = async (newFolderId: string): Promise<void> => {
    if (!selectedNote) return;

    await notes.changeFolder(
      selectedNote.id,
      newFolderId,
      folders.find((f) => f.id === newFolderId),
    );
  };


  if (isLoading) {
    return <p style={{ color: "white", padding: 20 }}>Loading notes...</p>;
  }

  if (loadError) {
    return (
      <p style={{ color: "white", padding: 20 }}>
        Couldn't load notes: {loadError}
      </p>
    );
  }

  return (
    <main
      className={`grid h-screen grid-cols-[300px_350px_1fr] overflow-hidden max-[1200px]:grid-cols-[220px_280px_1fr] max-[900px]:grid-cols-[180px_240px_1fr] max-[730px]:flex max-[730px]:h-auto max-[730px]:min-h-screen max-[730px]:w-full max-[730px]:flex-col max-[730px]:overflow-x-hidden max-[730px]:overflow-y-auto ${
        theme === "dark" ? "dark" : ""
      }`}
    >
      <Sidebar
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        handleNewNote={handleNewNote}
        folders={folders}
        recentNotes={recentNotes}
        selectedFolderId={selectedFolderId}
        showAddFolder={showAddFolder}
        setShowAddFolder={setShowAddFolder}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        handleAddFolder={handleAddFolder}
        handleRenameFolder={handleRenameFolder}
        handleDeleteFolder={handleDeleteFolder}
        selectedNoteId={selectedNoteId}
        specialView={specialView}
      />

      <NotesList
        selectedFolder={selectedFolder}
        visibleNotes={visibleNotes}
        selectedNoteId={selectedNoteId}
        handleSelectNote={handleSelectNote}
        specialView={specialView}
        onLoadMore={notes.loadMore}
        hasMore={
          notes.hasMore && (specialView === null || specialView === "favorites")
        }
        loadingMore={notes.loadingMore}
      />

      <section className="relative h-screen bg-[whitesmoke] p-[30px] text-[#181818] dark:bg-[#181818] dark:text-white max-[900px]:p-5 max-[730px]:h-auto max-[730px]:w-full max-[730px]:p-4">
        {!selectedNote ? (
          <EmptyState />
        ) : showRestore ? (
          <RestoreNote
            selectedNote={selectedNote}
            handleRestoreNote={handleRestoreNote}
          />
        ) : selectedNote.content === undefined ? null : (
          <NoteEditor
            selectedNote={selectedNote}
            folders={folders}
            handleFieldChange={notes.changeField}
            handleSaveNote={handleSaveNote}
            showMenu={showMenu}
            setShowMenu={setShowMenu}
            handleToggleFavorite={handleToggleFavorite}
            handleToggleArchive={handleToggleArchive}
            handleDeleteNote={handleDeleteNote}
            handleChangeFolder={handleChangeFolder}
          />
        )}
      </section>
    </main>
  );
}

export default NotesPage;
