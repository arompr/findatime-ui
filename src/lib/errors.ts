export type ApiErrorBody = {
  message?: string;
  error?: string;
};

/**
 * Thrown for every non-2xx API response (and for network failures, with
 * status 0) so TanStack Query surfaces them through isError.
 */
export class ApiRequestError extends Error {
  readonly status: number;
  /** Stable machine-readable code from the API's error envelope, e.g. "event_not_found". */
  readonly code: string | undefined;
  /** Human-readable detail from the API, if it provided one. */
  readonly detail: string | undefined;

  constructor(status: number, body: ApiErrorBody | undefined, url: string | undefined) {
    super(
      body?.message ??
        (url ? `Request to ${url} failed with status ${status}` : `Network request failed`),
    );
    this.name = "ApiRequestError";
    this.status = status;
    this.code = body?.error;
    this.detail = body?.message;
  }

  static from(error: unknown, response: Response | undefined): ApiRequestError {
    return new ApiRequestError(response?.status ?? 0, parseBody(error), response?.url);
  }
}

function parseBody(error: unknown): ApiErrorBody | undefined {
  if (typeof error === "string") {
    return { message: error };
  }
  if (typeof error === "object" && error !== null) {
    const body = error as ApiErrorBody;
    if (typeof body.message === "string" || typeof body.error === "string") {
      return body;
    }
  }
  return undefined;
}

const BY_ERROR_CODE: Record<string, string> = {
  event_not_found: "No event found with that code.",
  participant_already_joined: "You've already joined this event.",
  participant_not_found: "You haven't joined this event yet.",
  invalid_passcode: "This event needs a passcode, which isn't supported yet.",
  organizer_cannot_leave: "The organizer can't leave their own event.",
  forbidden: "You don't have permission to do that.",
  invalid_availability_range:
    "Some of those times are skipped by a daylight saving change. Adjust them and try again.",
  invalid_timezone: "That timezone isn't supported. Pick another one.",
  invalid_interval: "Pick 15 min, 30 min, or 1 hour time slots.",
  invalid_day_window: "Pick an end time after the start time.",
  unauthorized: "We couldn't recognize this browser. Reload the page and try again.",
  rate_limited: "Too many attempts. Wait a minute and try again.",
};

export function messageFor(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    if (error.code && BY_ERROR_CODE[error.code]) {
      return BY_ERROR_CODE[error.code];
    }
    if (error.status === 404) {
      return "No event found with that code.";
    }
    if (error.detail) {
      return error.detail;
    }
  }
  return fallback;
}

/** True when the API says the current guest has no participant in this event. */
export function isNotJoined(error: unknown): boolean {
  return error instanceof ApiRequestError && error.code === "participant_not_found";
}
