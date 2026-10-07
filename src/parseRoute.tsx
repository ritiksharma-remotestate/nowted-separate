import type { RouteState } from "./types";
function parseRoute(pathname: string): RouteState {
  const [a, b, c, d] = pathname.split("/").filter(Boolean);

  if (a === "folders" && b) {
    return {
      folderId: b,
      view: null,
      noteId: c === "notes" ? (d ?? null) : null,
    };
  }

  if (a === "favorites" || a === "archived" || a === "trash") {
    return {
      folderId: null,
      view: a,
      noteId: b === "notes" ? (c ?? null) : null,
    };
  }

  if (a === "notes" && b) {
    return { folderId: null, view: null, noteId: b };
  }

  return { folderId: null, view: null, noteId: null };
}
export default  parseRoute;