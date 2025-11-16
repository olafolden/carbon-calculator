import type {
  EmissionFactorsDatabase,
  EmissionFactorWithMeta,
  SystemType,
} from '../types';

/**
 * Maps layer IDs to their corresponding building system category
 * Based on standard building construction system classifications
 */
const SYSTEM_MAPPING: Record<string, SystemType> = {
  // Skin System - Building envelope components
  'Roof': 'Skin',
  'Facade': 'Skin',
  'Glazing': 'Skin',
  'External Wall': 'Skin',

  // Superstructure System - Primary structural components above ground
  'Beam -8.4 m': 'Superstructure',
  'Beam -6.3 m': 'Superstructure',
  'Column -8.4 m': 'Superstructure',
  'Column -6.3 m': 'Superstructure',
  'Floor Slab': 'Superstructure',
  'Composite Floor': 'Superstructure',
  'Core Wall': 'Superstructure',
  'Staircase': 'Superstructure',

  // Substructure System - Foundation and below-ground components
  'Foundation': 'Substructure',
  'Basement Wall': 'Substructure',
  'Pile': 'Substructure',
  'Ground Floor Slab': 'Substructure',
};

/**
 * Determines which building system a layer belongs to
 * @param layerId - The unique identifier for the building layer
 * @returns The system category, defaults to 'Superstructure' if not found
 */
export function getSystemForLayer(layerId: string): SystemType {
  return SYSTEM_MAPPING[layerId] || 'Superstructure';
}

/**
 * Enriches emission factors with metadata for UI display and filtering
 * Combines default factors with any custom overrides and adds system classification
 *
 * @param defaultFactors - The base emission factors database
 * @param customFactors - Optional custom emission factors that override defaults
 * @returns Array of emission factors with added metadata
 */
export function enrichEmissionFactors(
  defaultFactors: EmissionFactorsDatabase,
  customFactors?: EmissionFactorsDatabase
): EmissionFactorWithMeta[] {
  return Object.entries(defaultFactors)
    .filter(([id, factor]) => {
      // Validate factor has required fields
      if (!factor || typeof factor.factor !== 'number' || !factor.unit || !factor.material) {
        console.warn(`Invalid emission factor for ${id}, skipping`);
        return false;
      }
      return true;
    })
    .map(([id, factor]) => {
      const isCustomized = customFactors?.[id] !== undefined;
      const customFactor = customFactors?.[id];

      return {
        id,
        system: getSystemForLayer(id),
        isCustomized,
        // Use custom values if they exist, otherwise use defaults
        factor: customFactor?.factor ?? factor.factor,
        unit: customFactor?.unit ?? factor.unit,
        material: customFactor?.material ?? factor.material,
      };
    });
}

/**
 * Filters emission factors by building system category
 *
 * @param factors - Array of emission factors to filter
 * @param system - System category to filter by, or 'All' for no filtering
 * @returns Filtered array of emission factors
 */
export function filterBySystem(
  factors: EmissionFactorWithMeta[],
  system: SystemType | 'All'
): EmissionFactorWithMeta[] {
  if (system === 'All') return factors;
  return factors.filter(f => f.system === system);
}

/**
 * Filters emission factors by unit type
 *
 * @param factors - Array of emission factors to filter
 * @param unit - Unit type to filter by, or 'All' for no filtering
 * @returns Filtered array of emission factors
 */
export function filterByUnit(
  factors: EmissionFactorWithMeta[],
  unit: 'kgCO2e/m²' | 'kgCO2e/m' | 'All'
): EmissionFactorWithMeta[] {
  if (unit === 'All') return factors;
  return factors.filter(f => f.unit === unit);
}

/**
 * Searches emission factors by ID or material description
 * Case-insensitive search across both fields
 *
 * @param factors - Array of emission factors to search
 * @param searchTerm - Search query string
 * @returns Filtered array matching the search term
 */
export function searchFactors(
  factors: EmissionFactorWithMeta[],
  searchTerm: string
): EmissionFactorWithMeta[] {
  if (!searchTerm.trim()) return factors;

  const term = searchTerm.toLowerCase();
  return factors.filter(f =>
    f.id.toLowerCase().includes(term) ||
    f.material.toLowerCase().includes(term)
  );
}

/**
 * Merges custom emission factors with defaults
 * Custom factors override defaults for matching IDs
 *
 * @param defaultFactors - Base emission factors database
 * @param customFactors - Optional custom factors to override defaults
 * @returns Merged emission factors database
 */
export function mergeEmissionFactors(
  defaultFactors: EmissionFactorsDatabase,
  customFactors?: EmissionFactorsDatabase
): EmissionFactorsDatabase {
  if (!customFactors) return defaultFactors;

  const merged: EmissionFactorsDatabase = { ...defaultFactors };

  // Only merge valid custom factors
  for (const [id, customFactor] of Object.entries(customFactors)) {
    if (defaultFactors[id] && customFactor.factor !== undefined) {
      merged[id] = {
        factor: customFactor.factor,
        unit: customFactor.unit ?? defaultFactors[id].unit,
        material: customFactor.material ?? defaultFactors[id].material,
      };
    }
  }

  return merged;
}

// Maximum allowed emission factor (1 million kgCO2e)
const MAX_EMISSION_FACTOR = 1000000;

/**
 * Validates that a factor value is within acceptable range
 *
 * @param value - The emission factor value to validate
 * @returns true if valid, false otherwise
 */
export function validateFactorValue(value: number): boolean {
  return typeof value === 'number' &&
         !isNaN(value) &&
         isFinite(value) &&
         value >= 0 &&
         value <= MAX_EMISSION_FACTOR &&
         value === value; // Additional NaN check
}

/**
 * Validates emission factor with detailed error messages
 *
 * @param value - The emission factor value to validate
 * @param min - Minimum allowed value (default: 0)
 * @param max - Maximum allowed value (default: 1,000,000)
 * @returns Validation result with error message if invalid
 */
export function validateFactorRange(
  value: number,
  min: number = 0,
  max: number = MAX_EMISSION_FACTOR
): { valid: boolean; error?: string } {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return { valid: false, error: 'Value must be a valid number' };
  }
  if (value < min) {
    return { valid: false, error: `Value must be at least ${min}` };
  }
  if (value > max) {
    return { valid: false, error: `Value cannot exceed ${max.toLocaleString()}` };
  }
  return { valid: true };
}

/**
 * Counts how many emission factors have been customized
 *
 * @param customFactors - Custom emission factors object
 * @returns Number of customized factors
 */
export function countCustomizedFactors(
  customFactors?: EmissionFactorsDatabase
): number {
  if (!customFactors) return 0;
  return Object.keys(customFactors).length;
}
