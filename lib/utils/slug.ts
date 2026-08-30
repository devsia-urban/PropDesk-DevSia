/**
 * Converts any string to a valid URL slug:
 * - Lowercases everything
 * - Replaces spaces/special chars with hyphens
 * - Strips leading/trailing hyphens
 * - Collapses multiple hyphens into one
 */
export function toSlug(input: string | null | undefined): string {
  if (!input) return 'property'
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // Remove special chars
    .replace(/[\s_]+/g, '-')          // Spaces and underscores → hyphen
    .replace(/-+/g, '-')              // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '')          // Strip leading/trailing hyphens
    || 'property'                      // Final fallback if result is empty
}
