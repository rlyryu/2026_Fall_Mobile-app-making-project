/**
 * Tiny change notifier. Every write function in `src/db/` calls `notifyDbChanged()`;
 * data hooks subscribe and re-query. This is the app's only cross-screen refresh mechanism
 * (no global state library).
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeDbChanges(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyDbChanged(): void {
  listeners.forEach((l) => l());
}
