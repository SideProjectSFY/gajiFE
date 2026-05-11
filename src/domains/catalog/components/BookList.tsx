import Link from 'next/link';
import type { Book } from '@/domains/catalog/types/book';

export function BookList({ books }: { books: Book[] }) {
  return (
    <ul>
      {books.map((book) => (
        <li key={book.id}>
          <Link href={`/books/${book.id}`}>{book.title}</Link>
        </li>
      ))}
    </ul>
  );
}
