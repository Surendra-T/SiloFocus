import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
const isValidDsn = !!dsn && /^https:\/\/[^@]+@[^/]+\/\d+$/.test(dsn);

if (isValidDsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
    enabled: true,
    sendDefaultPii: false,
  });
}
