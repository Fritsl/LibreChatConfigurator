/**
 * Deep merge utility for configuration objects
 * Recursively merges nested objects, preserving existing values when not explicitly overwritten
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (sourceValue === undefined) {
      continue;
    }

    if (isObject(sourceValue) && isObject(targetValue) && !Array.isArray(sourceValue)) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue as any;
    }
  }

  return result;
}

function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object';
}
