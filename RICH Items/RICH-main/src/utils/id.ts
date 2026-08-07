export function newId(prefix?: string) {
  const uuid =
    // React Native (Hermes) + modern JS runtimes
    globalThis.crypto?.randomUUID?.() ??
    // Fallback (not cryptographically strong; OK for local-only IDs)
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  return prefix ? `${prefix}_${uuid}` : uuid;
}

