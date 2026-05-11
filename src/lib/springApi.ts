export function springApi(path: string, init?: RequestInit): Promise<Response> {
  const baseUrl = process.env.SPRING_API_BASE_URL ?? 'http://localhost:8080';

  return fetch(baseUrl + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });
}
