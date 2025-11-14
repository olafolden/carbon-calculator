/**
 * Main building characteristics including floor area and height information
 */
export interface BuildingMain {
  /** Gross Floor Area in square meters (m²) */
  gfa: number;
  /** Total number of floors/levels in the building */
  amountOfLevels: number;
  /** Standard floor-to-floor height in meters for typical floors */
  floorToFloorHeight: number;
  /** Floor-to-floor height in meters for the ground floor (often higher) */
  floorToFloorHeightGroundFloor: number;
}

/**
 * Represents a single building component/layer with its dimensions
 */
export interface Layer {
  /** Unique identifier matching an entry in the emission factors database */
  id: string;
  /** Area in square meters (m²) for planar elements like floors, walls, facades */
  area?: number;
  /** Length in meters (m) for linear elements like beams, columns, piles */
  length?: number;
}

/**
 * Groups related building layers into systems (e.g., Skin, Superstructure, Substructure)
 */
export interface SystemLayer {
  /** System identifier (e.g., "Skin", "Superstructure", "Substructure") */
  id: string;
  /** Array of building component layers within this system */
  layers: Layer[];
}

/**
 * Complete building data structure including main characteristics and all systems
 */
export interface BuildingData {
  /** Main building characteristics */
  main: BuildingMain;
  /** Array of building systems, each containing multiple layers */
  sLayers: SystemLayer[];
}

/**
 * Carbon emission factor for a specific building material or assembly
 */
export interface EmissionFactor {
  /** Emission factor value (kgCO2e per unit) */
  factor: number;
  /** Unit of measurement (per square meter or per meter) */
  unit: 'kgCO2e/m²' | 'kgCO2e/m';
  /** Description of the material or assembly */
  material: string;
}

/**
 * Database of emission factors indexed by layer ID
 */
export type EmissionFactorsDatabase = Record<string, EmissionFactor>;

/**
 * Carbon emission calculation result for a single layer
 */
export interface LayerCalculation {
  /** Layer identifier */
  id: string;
  /** Quantity (area or length) used in calculation */
  quantity: number;
  /** Unit of quantity measurement */
  unit: 'm²' | 'm';
  /** Emission factor applied (kgCO2e per unit) */
  emissionFactor: number;
  /** Total embodied carbon emissions for this layer (kgCO2e) */
  totalEmissions: number;
  /** Material or assembly description */
  material: string;
}

/**
 * Carbon emission calculation result for an entire building system
 */
export interface SystemCalculation {
  /** System identifier */
  systemId: string;
  /** Array of layer calculations within this system */
  layers: LayerCalculation[];
  /** Total embodied carbon emissions for this system (kgCO2e) */
  totalEmissions: number;
}

/**
 * Complete carbon calculation results for the entire building
 */
export interface CalculationResult {
  /** Array of system-level calculations */
  systems: SystemCalculation[];
  /** Total embodied carbon emissions for the entire building (kgCO2e) */
  totalEmissions: number;
  /** Carbon intensity per unit floor area (kgCO2e/m² GFA) */
  carbonIntensity: number;
  /** Gross Floor Area used in intensity calculation (m²) */
  gfa: number;
}

/**
 * Validation error for user input
 */
export interface ValidationError {
  /** Field or path where the error occurred */
  field: string;
  /** Human-readable error message */
  message: string;
}
