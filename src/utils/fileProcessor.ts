import { BuildingData, ValidationError } from '../types';
import { validateBuildingData } from './calculator';
import { MAX_FILE_SIZE, MAX_JSON_DEPTH } from '../constants';

/**
 * Check if object has prototype pollution attempt
 * Only checks for own properties, not inherited ones
 */
function hasPrototypePollution(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;

  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];

  // Check if any dangerous keys are OWN properties (not inherited)
  if (dangerousKeys.some(key => Object.prototype.hasOwnProperty.call(obj, key))) {
    return true;
  }

  // Recursively check nested objects
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as Record<string, unknown>)[key];
      if (typeof value === 'object' && value !== null) {
        if (hasPrototypePollution(value)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Calculate JSON depth to prevent stack overflow
 */
function getJSONDepth(obj: unknown, currentDepth = 0): number {
  if (typeof obj !== 'object' || obj === null) return currentDepth;

  let maxDepth = currentDepth;

  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) {
      const depth = getJSONDepth(value, currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  return maxDepth;
}

/**
 * Process and validate a JSON file for building data
 */
export async function processJSONFile(
  file: File,
  onSuccess: (data: BuildingData, filename: string) => void,
  onError: (errors: ValidationError[]) => void
): Promise<void> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    onError([{
      field: 'file',
      message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }]);
    return;
  }

  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;

        if (!content) {
          onError([{ field: 'file', message: 'File is empty' }]);
          reject(new Error('File is empty'));
          return;
        }

        // Parse JSON
        let jsonData: unknown;
        try {
          jsonData = JSON.parse(content);
        } catch (parseError) {
          const message = parseError instanceof Error
            ? `Invalid JSON: ${parseError.message}`
            : 'Invalid JSON file';
          onError([{ field: 'file', message }]);
          reject(parseError);
          return;
        }

        // Check for prototype pollution
        if (hasPrototypePollution(jsonData)) {
          onError([{
            field: 'file',
            message: 'Invalid JSON structure: contains dangerous properties',
          }]);
          reject(new Error('Prototype pollution detected'));
          return;
        }

        // Check JSON depth
        const depth = getJSONDepth(jsonData);
        if (depth > MAX_JSON_DEPTH) {
          onError([{
            field: 'file',
            message: `JSON structure too deep (max ${MAX_JSON_DEPTH} levels)`,
          }]);
          reject(new Error('JSON too deep'));
          return;
        }

        // Validate building data structure
        const errors = validateBuildingData(jsonData);
        if (errors.length > 0) {
          onError(errors);
          reject(new Error('Validation failed'));
          return;
        }

        // Success - call callback
        onSuccess(jsonData as BuildingData, file.name);
        resolve();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error processing file';
        onError([{ field: 'file', message }]);
        reject(error);
      }
    };

    reader.onerror = () => {
      const error = new Error('Error reading file');
      onError([{ field: 'file', message: error.message }]);
      reject(error);
    };

    reader.readAsText(file);
  });
}
