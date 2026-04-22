// Error telemetry stub.
// No external SDK is wired up — this is intentionally a no-op sender.
// Events are buffered in memory (last 50) so they can be inspected during
// debugging via `window.__ophtho_telemetry` in development.

export interface TelemetryEvent {
  type: "error" | "warning" | "info";
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

const MAX_BUFFER = 50;
const buffer: TelemetryEvent[] = [];

function enrich(
  event: Omit<TelemetryEvent, "timestamp" | "userAgent" | "url">
): TelemetryEvent {
  const base: TelemetryEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    base.userAgent = window.navigator?.userAgent;
    base.url = window.location?.href;
  }
  return base;
}

function push(event: TelemetryEvent): void {
  buffer.push(event);
  if (buffer.length > MAX_BUFFER) {
    buffer.splice(0, buffer.length - MAX_BUFFER);
  }
  if (
    typeof window !== "undefined" &&
    process.env.NODE_ENV !== "production"
  ) {
    // Expose for debugging in dev
    (window as unknown as { __ophtho_telemetry?: TelemetryEvent[] }).__ophtho_telemetry = buffer;
  }
}

export function logEvent(
  event: Omit<TelemetryEvent, "timestamp" | "userAgent" | "url">
): void {
  try {
    const enriched = enrich(event);
    push(enriched);
    // Future: send to Sentry/PostHog/etc. For now, console in dev only.
    if (process.env.NODE_ENV !== "production") {
      const method =
        enriched.type === "error"
          ? "error"
          : enriched.type === "warning"
            ? "warn"
            : "log";
      console[method]("[telemetry]", enriched.message, enriched.context ?? "");
    }
  } catch {
    // Never let telemetry throw
  }
}

export function logError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown error";
  const stack = error instanceof Error ? error.stack : undefined;
  logEvent({
    type: "error",
    message,
    context: { ...context, stack },
  });
}

export function getRecentEvents(): TelemetryEvent[] {
  return [...buffer];
}
