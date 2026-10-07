export const API_BASE_URL = import.meta.env.VITE_API_URL as string;

async function send(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res;
}

export async function getJson<T>(path: string): Promise<T> {
  return (await send(path)).json();
}

export function sendJson(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
): Promise<Response> {
  return send(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function sendPlain(
  path: string,
  method: "POST" | "DELETE",
): Promise<void> {
  await send(path, { method, headers: { Accept: "text/plain" } });
}
