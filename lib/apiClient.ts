// Клиентский fetch: сначала res.ok, тело через text() → безопасный парс (железное правило #5).
async function parse(res: Response) {
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* не JSON */
  }
  return { res, json, text };
}

export async function apiPost<T = unknown>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const { json, text } = await parse(res);
  if (!res.ok) {
    const msg = (json as { error?: string } | null)?.error ?? text ?? `Ошибка ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

export async function apiGet<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  const { json, text } = await parse(res);
  if (!res.ok) {
    const msg = (json as { error?: string } | null)?.error ?? text ?? `Ошибка ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}
