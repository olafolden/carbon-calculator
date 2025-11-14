/**
 * Carbon emission benchmarks for different building types
 * Values in kgCO2e/m² (embodied carbon intensity)
 */
export const BUILDING_BENCHMARKS = {
  office: {
    low: 400,
    high: 600,
    type: 'Office Building'
  },
  residential: {
    low: 300,
    high: 500,
    type: 'Residential Building'
  },
  industrial: {
    low: 500,
    high: 800,
    type: 'Industrial Building'
  }
} as const;

export type BuildingType = keyof typeof BUILDING_BENCHMARKS;

// Default benchmark to use (office buildings)
export const DEFAULT_BENCHMARK = BUILDING_BENCHMARKS.office;
