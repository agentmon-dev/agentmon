import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: "https://8dbd1a3c4320bc920e4c5d2e22b9d5ce@o4511137976877056.ingest.us.sentry.io/4511137979826176",
	tracesSampleRate: 1.0,
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
	integrations: [Sentry.replayIntegration()],
});
