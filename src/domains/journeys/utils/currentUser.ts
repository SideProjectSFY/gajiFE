export interface CurrentUser {
  userId: string | null;
  username: string | null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const chunks = token.split('.');
  if (chunks.length < 2) {
    return null;
  }

  try {
    const normalized = chunks[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getCurrentUserFromToken(): CurrentUser {
  const token = window.localStorage.getItem('accessToken') || window.localStorage.getItem('token');
  if (!token) {
    return { userId: null, username: null };
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return { userId: null, username: null };
  }

  const userIdCandidate = payload.userId ?? payload.uid ?? payload.sub;
  const usernameCandidate = payload.username ?? payload.preferred_username ?? payload.name;

  return {
    userId: typeof userIdCandidate === 'string' ? userIdCandidate : null,
    username: typeof usernameCandidate === 'string' ? usernameCandidate : null
  };
}

export function canMutateOwnedResource(
  owner: { userId?: string; username?: string },
  currentUser: CurrentUser,
  options?: { requireExplicitOwner?: boolean }
): boolean {
  const requireExplicitOwner = options?.requireExplicitOwner ?? false;
  const hasOwnerMetadata = Boolean(owner.userId || owner.username);

  if (!hasOwnerMetadata) {
    return !requireExplicitOwner;
  }

  if (owner.userId && currentUser.userId && owner.userId === currentUser.userId) {
    return true;
  }

  if (owner.username && currentUser.username && owner.username === currentUser.username) {
    return true;
  }

  return false;
}
