import { ApiError } from "@arompr/findatime-typescript-client";

const BY_ERROR_CODE: Record<string, string> = {
  event_not_found: "No event found with that code.",
  participant_already_joined: "You've already joined this event.",
};

export function messageFor(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const body = error.body as { error?: string; message?: string } | undefined;
    if (body?.error && BY_ERROR_CODE[body.error]) {
      return BY_ERROR_CODE[body.error];
    }
    if (error.status === 404) {
      return "No event found with that code.";
    }
    if (body?.message) {
      return body.message;
    }
  }
  return fallback;
}
