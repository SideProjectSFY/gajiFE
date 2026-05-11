export type JourneyGroup = 'scenario' | 'conversation' | 'social' | 'search';

const ENV_KEYS: Record<JourneyGroup, string> = {
  scenario: 'SCENARIO_ROLLBACK_ENABLED',
  conversation: 'CONVERSATION_ROLLBACK_ENABLED',
  social: 'SOCIAL_ROLLBACK_ENABLED',
  search: 'SEARCH_ROLLBACK_ENABLED'
};

function getCookieKey(group: JourneyGroup): string {
  return `journey_rollback_${group}`;
}

function readCookieValue(cookieHeader: string | null | undefined, cookieName: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const token = cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${cookieName}=`));

  if (!token) {
    return null;
  }

  return token.slice(cookieName.length + 1);
}

export function isJourneyRollbackEnabled(group: JourneyGroup, cookieHeader?: string | null): boolean {
  const cookieValue = readCookieValue(cookieHeader, getCookieKey(group));

  if (cookieValue === 'true') {
    return true;
  }

  if (cookieValue === 'false') {
    return false;
  }

  return process.env[ENV_KEYS[group]] === 'true';
}

export function getLegacyFrontendBaseUrl(): string {
  return process.env.LEGACY_FE_BASE_URL ?? 'http://localhost:5173';
}

export function getLegacyJourneyUrl(path: string): string {
  const base = getLegacyFrontendBaseUrl().endsWith('/')
    ? getLegacyFrontendBaseUrl()
    : `${getLegacyFrontendBaseUrl()}/`;

  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return new URL(normalized, base).toString();
}

export function getJourneyRollbackCookieName(group: JourneyGroup): string {
  return getCookieKey(group);
}
