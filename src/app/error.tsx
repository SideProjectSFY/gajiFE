'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className='content-page'>
      <h1>Something went wrong</h1>
      <p>Please try again.</p>
      <button onClick={reset}>Retry</button>
    </section>
  );
}
