import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import parseRoute from "../parseRoute";
import type { SpecialView } from "../types";

type RouteContextType = {
  selectedNoteId: string | null;
  selectedFolderId: string | null;
  specialView: SpecialView;
  basePath: string; // where the current list lives, without the note part
};

const RouteContext = createContext<RouteContextType | null>(null);

function RouteProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  const value = useMemo<RouteContextType>(() => {
    const { folderId, view, noteId } = parseRoute(pathname);

    return {
      selectedNoteId: noteId,
      selectedFolderId: folderId,
      specialView: view,
      basePath: folderId ? `/folders/${folderId}` : view ? `/${view}` : "",
    };
  }, [pathname]);

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
}

export const useRoute = (): RouteContextType => {
  const context = useContext(RouteContext);

  if (!context) {
    throw new Error("useRoute must be used inside RouteProvider");
  }

  return context;
};

export default RouteProvider;