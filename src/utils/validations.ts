/**
 * Utility validation functions
 */

export function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.length > 0;
}
