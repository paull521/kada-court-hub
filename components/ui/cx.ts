/**
 * Joins class names, dropping anything falsy.
 *
 * Every primitive in this folder takes a `className` and merges it, because
 * the classes in this app come in pairs: a shared one that does the work and
 * a modifier that places it. `card join-card`, `btn secondary batch-save-button`.
 * A primitive that overwrote the second half would be unusable.
 */
export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
