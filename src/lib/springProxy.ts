import 'server-only';

const JSON_CONTENT_TYPE = 'application/json';

function getBaseUrl(): string {
  return process.env.SPRING_API_BASE_URL ?? 'http://localhost:8080';
}

function buildForwardHeaders(request: Request): Headers {
  const headers = new Headers();
  const incoming = request.headers;

  const contentType = incoming.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }

  const authorization = incoming.get('authorization');
  if (authorization) {
    headers.set('authorization', authorization);
  }

  const cookie = incoming.get('cookie');
  if (cookie) {
    headers.set('cookie', cookie);
  }

  const accept = incoming.get('accept');
  headers.set('accept', accept ?? JSON_CONTENT_TYPE);

  return headers;
}

export async function proxyToSpringApiV1(request: Request, downstreamPath: string): Promise<Response> {
  const url = new URL(request.url);

  if (
    process.env.ENABLE_E2E_MOCK_DOWNSTREAM === 'true' &&
    request.headers.get('x-e2e-downstream-mock') === 'true'
  ) {
    return Response.json(
      {
        mocked: true,
        downstreamPath,
        query: Object.fromEntries(url.searchParams.entries())
      },
      { status: 200 }
    );
  }

  const target = `${getBaseUrl()}/api/v1${downstreamPath}${url.search}`;

  const init: RequestInit = {
    method: request.method,
    headers: buildForwardHeaders(request),
    cache: 'no-store',
    redirect: 'manual'
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  try {
    return await fetch(target, init);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reach downstream API';
    return Response.json(
      {
        message: 'Downstream API unavailable',
        detail: message,
        downstreamPath
      },
      { status: 503 }
    );
  }
}
