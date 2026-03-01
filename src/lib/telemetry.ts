type TelemetryContext = Record<string, unknown>;

function normalizeError(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: 'Unknown error' };
  }
}

function baseLog(
  level: 'error' | 'warn',
  channel: 'server' | 'client',
  event: string,
  error: unknown,
  context?: TelemetryContext,
) {
  const normalized = normalizeError(error);
  const payload = {
    channel,
    event,
    message: normalized.message,
    stack: normalized.stack,
    context: context ?? {},
    at: new Date().toISOString(),
  };
  if (level === 'error') {
    console.error('[telemetry]', payload);
  } else {
    console.warn('[telemetry]', payload);
  }
}

export function reportServerError(event: string, error: unknown, context?: TelemetryContext) {
  baseLog('error', 'server', event, error, context);
}

export function reportClientError(event: string, error: unknown, context?: TelemetryContext) {
  baseLog('error', 'client', event, error, context);
}
