import type { Folder, FoldersResponse } from "../types";
import { getJson, sendJson, sendPlain } from "./client";

export async function fetchFolders(): Promise<Folder[]> {
  const data = await getJson<Folder[] | FoldersResponse>("/folders");
  return Array.isArray(data) ? data : (data.folders ?? data.data ?? []);
}

export async function createFolder(name: string): Promise<void> {
  await sendJson("/folders", "POST", { name });
}

export async function renameFolder(id: string, name: string): Promise<void> {
  await sendJson(`/folders/${id}`, "PATCH", { name });
}

export async function deleteFolder(id: string): Promise<void> {
  await sendPlain(`/folders/${id}`, "DELETE");
}