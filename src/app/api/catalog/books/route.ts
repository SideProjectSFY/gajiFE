import { NextResponse } from 'next/server';
import { getCatalogBooks } from '@/domains/catalog/services/getCatalogBooks';
import { isCatalogRollbackEnabled } from '@/domains/catalog/services/catalogRollback';
import type { BookSortOption } from '@/domains/catalog/types/book';

export async function GET(request: Request) {
  if (isCatalogRollbackEnabled()) {
    return NextResponse.json(
      { message: 'Catalog gateway rollback is enabled' },
      { status: 503, headers: { 'x-catalog-rollback': 'true' } }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') ?? '0', 10);
    const size = Number.parseInt(searchParams.get('size') ?? '20', 10);
    const genre = searchParams.get('genre') ?? undefined;
    const sort = (searchParams.get('sort') ?? 'latest') as BookSortOption;
    const search = searchParams.get('search') ?? undefined;

    const response = await getCatalogBooks({ page, size, genre, sort, search });
    return NextResponse.json(response, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Failed to fetch catalog books' }, { status: 500 });
  }
}
