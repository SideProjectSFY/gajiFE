export function isCatalogRollbackEnabled(): boolean {
  return process.env.CATALOG_ROLLBACK_ENABLED === 'true';
}

export function getCatalogRollbackBaseUrl(): string {
  return process.env.CATALOG_ROLLBACK_BASE_URL ?? 'http://localhost:5173';
}

export function getCatalogRollbackUrl(path: string): string {
  return new URL(path, getCatalogRollbackBaseUrl()).toString();
}
