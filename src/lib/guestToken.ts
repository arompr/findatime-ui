import { FindAtimeApi } from "@arompr/findatime-typescript-client";
import { ApiRequestError } from "./errors";

const TOKEN_KEY = "findatime.guestToken";
/** Pre-token identity (a browser-generated UUID); exchanged once for a token. */
const LEGACY_GUEST_ID_KEY = "findatime.guestId";

let pending: Promise<string> | null = null;

/**
 * This browser's guest token. Issued by the API on first use and kept in
 * localStorage; concurrent callers share the same in-flight request so only
 * one guest is created.
 */
export function getGuestToken(): Promise<string> {
  const stored = window.localStorage.getItem(TOKEN_KEY);
  if (stored) return Promise.resolve(stored);

  pending ??= issueGuestToken().finally(() => {
    pending = null;
  });
  return pending;
}

/** Forgets a token the API no longer recognizes so the next call issues a new one. */
export function resetGuestToken(rejected: string): void {
  if (window.localStorage.getItem(TOKEN_KEY) === rejected) {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

async function issueGuestToken(): Promise<string> {
  const legacyGuestId = window.localStorage.getItem(LEGACY_GUEST_ID_KEY);
  let token: string;
  try {
    token = await createGuest(legacyGuestId);
  } catch (error) {
    // Already claimed (409) or malformed (400): this browser's old events can't
    // be recovered, so start fresh instead of failing every request.
    const unrecoverable =
      error instanceof ApiRequestError && (error.status === 400 || error.status === 409);
    if (legacyGuestId === null || !unrecoverable) throw error;
    token = await createGuest(null);
  }

  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.removeItem(LEGACY_GUEST_ID_KEY);
  return token;
}

async function createGuest(legacyGuestId: string | null): Promise<string> {
  const { data, error, response } = await FindAtimeApi.createGuest({
    body: legacyGuestId ? { legacyGuestId } : undefined,
  });
  if (!response?.ok || !data) {
    throw ApiRequestError.from(error, response);
  }
  return data.guestToken;
}
