import { NextResponse } from 'next/server';
import { getCatalogBookDetail } from '@/domains/catalog/services/getCatalogBookDetail';
import { isCatalogRollbackEnabled } from '@/domains/catalog/services/catalogRollback';

export async function GET(_request: Request, context: { params: Promise<{ bookId: string }> }) {
  if (isCatalogRollbackEnabled()) {
    return NextResponse.json(
      { message: 'Catalog gateway rollback is enabled' },
      { status: 503, headers: { 'x-catalog-rollback': 'true' } }
    );
  }

  try {
    const { bookId } = await context.params;
    const response = await getCatalogBookDetail(bookId);
    return NextResponse.json(response, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch catalog book detail' }, { status: 500 });
  }
}
