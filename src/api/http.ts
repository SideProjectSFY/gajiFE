export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message);
  }
}

export function getRequestLocale(): 'ko' | 'en' {
  if (typeof window === 'undefined') {
    return 'ko';
  }

  const directLocale = window.localStorage.getItem('locale');
  if (directLocale === 'en' || directLocale === 'ko') {
    return directLocale;
  }

  const persisted = window.localStorage.getItem('locale-storage');
  if (persisted) {
    try {
      const parsed = JSON.parse(persisted) as { state?: { locale?: string } };
      const persistedLocale = parsed.state?.locale;
      if (persistedLocale === 'en' || persistedLocale === 'ko') {
        return persistedLocale;
      }
    } catch {
      return 'ko';
    }
  }

  return 'ko';
}

export function createJsonHeaders(headers?: HeadersInit): Headers {
  const nextHeaders = new Headers(headers);
  if (!nextHeaders.has('Content-Type')) {
    nextHeaders.set('Content-Type', 'application/json');
  }
  if (!nextHeaders.has('Accept-Language')) {
    nextHeaders.set('Accept-Language', getRequestLocale());
  }
  return nextHeaders;
}

export async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: createJsonHeaders(init?.headers),
    cache: 'no-store'
  });

  if (!response.ok) {
    let body: unknown = undefined;
    try {
      body = await response.json();
    } catch {
      body = await response.text().catch(() => undefined);
    }

    throw new ApiError(`Request failed: ${input}`, response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function requestJsonOrNullOn404<T>(input: string, init?: RequestInit): Promise<T | null> {
  try {
    return await requestJson<T>(input, init);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
