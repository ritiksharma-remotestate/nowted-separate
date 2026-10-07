import { useEffect, useState } from "react";
import type { Folder } from "../types";
import * as foldersApi from "../api/foldersApi";

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    foldersApi
      .fetchFolders()
      .then(setFolders)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Something went wrong"),
      )
      .finally(() => setLoading(false));
  }, []);

  const addFolder = async (name: string): Promise<boolean> => {
    try {
      await foldersApi.createFolder(name);
      setFolders(await foldersApi.fetchFolders());
      return true;
    } catch (err: unknown) {
      console.error("Failed to create folder:", err);
      alert("Couldn't create the folder — check the console for details.");
      return false;
    }
  };

  const renameFolder = async (id: string, name: string): Promise<boolean> => {
    try {
      await foldersApi.renameFolder(id, name);
      setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
      return true;
    } catch (err: unknown) {
      console.error("Failed to rename folder:", err);
      alert("Couldn't rename the folder — check the console for details.");
      return false;
    }
  };

  const deleteFolder = async (id: string): Promise<boolean> => {
    try {
      await foldersApi.deleteFolder(id);
      setFolders((prev) => prev.filter((f) => f.id !== id));
      return true;
    } catch (err: unknown) {
      console.error("Failed to delete folder:", err);
      alert("Couldn't delete the folder — check the console for details.");
      return false;
    }
  };

  return { folders, loading, error, addFolder, renameFolder, deleteFolder };
}