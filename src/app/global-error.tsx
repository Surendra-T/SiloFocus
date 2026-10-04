"use client";

import * as Sentry from "@sentry/nextjs";
import Error from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="bg-alabaster dark:bg-stone-950 flex items-center justify-center min-h-screen text-stone-900 dark:text-stone-100">
        <div className="text-center p-8 max-w-md">
          <h2 className="font-serif text-3xl mb-4">Something went wrong</h2>
          <p className="font-sans mb-8 opacity-80">We've noted the error and will look into it.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-full bg-racing text-white dark:bg-stone-800"
          >
            Refresh
          </button>
        </div>
      </body>
    </html>
  );
}
