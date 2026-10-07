import "./NotesList.css";
import { useEffect, useRef } from "react";
import type { Note, Folder } from "../../types";
import { useTheme } from "../../context/themeContext";

type NotesListProps = {
  selectedFolder: Folder | null;
  visibleNotes: Note[];
  selectedNoteId: string | null;
  handleSelectNote: (note: Note) => void;
  specialView: string | null;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  loadingMore: boolean;
};

function NotesList({
  selectedFolder,
  visibleNotes,
  selectedNoteId,
  handleSelectNote,
  specialView,
  onLoadMore,
  hasMore,
  loadingMore,
}: NotesListProps) {
  const { theme } = useTheme();

  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMoreRef.current();
        }
      },
      { root: listRef.current, rootMargin: "100px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, visibleNotes.length]);

  return (
    <section
      className={`h-screen bg-[whitesmoke] text-[#181818] dark:bg-[#1c1c1c] dark:text-white ${
        theme === "dark" ? "dark" : ""
      }`}
    >
      <h1 className="m-0 py-[5%] pr-[5%] pl-[3%] text-left text-[22px]  text-inherit">
        {specialView === "favorites"
          ? "Favorites"
          : specialView === "trash"
            ? "Trash"
            : specialView === "archived"
              ? "Archived Notes"
              : selectedFolder
                ? selectedFolder.name
                : "All notes"}
      </h1>

      <div ref={listRef} className="doc-list h-[90vh] overflow-y-auto">
        {visibleNotes.map((note) => (
          <div
            className={`mx-auto mb-2.5 flex h-[98px] w-[310px] max-w-[95%] cursor-pointer flex-col gap-2.5 rounded-[3px] p-5 text-left text-inherit ${
              selectedNoteId === note.id
                ? "bg-black/10 dark:bg-white/10"
                : "bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.03] dark:hover:bg-white/10"
            }`}
            key={note.id}
            onClick={() => handleSelectNote(note)}
          >
            <h3 className="truncate text-lg leading-6 ">
              {note.title}
            </h3>

            <div className="flex items-center gap-2 leading-6">
              <span className="shrink-0 text-base text-black/50 dark:text-white/40">
                {new Date(note.createdAt).toLocaleDateString("en-GB")}
              </span>

              <span className="min-w-0 flex-1 truncate text-base text-black/60 dark:text-white/60">
                {note.preview}
              </span>
            </div>
          </div>
        ))}

        {hasMore && <div ref={sentinelRef} className="h-px" />}
        {loadingMore && <p className="py-2 text-center">Loading...</p>}
      </div>
    </section>
  );
}

export default NotesList;
