import {
  BuildingData,
  EmissionFactorsDatabase,
  CalculationResult,
  SystemCalculation,
  LayerCalculation,
  ValidationError,
} from '../types';
import { logger } from './logger';

/**
 * Validates the structure of uploaded building data
 */
export function validateBuildingData(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({ field: 'root', message: 'Invalid JSON structure' });
    return errors;
  }

  const buildingData = data as Partial<BuildingData>;

  // Validate main section
  if (!buildingData.main) {
    errors.push({ field: 'main', message: 'Missing "main" section' });
  } else {
    const { gfa, amountOfLevels, floorToFloorHeight, floorToFloorHeightGroundFloor } = buildingData.main;

    // GFA validation
    if (typeof gfa !== 'number' || !isFinite(gfa) || gfa <= 0) {
      errors.push({ field: 'main.gfa', message: 'GFA must be a positive finite number' });
    } else if (gfa > 1000000) {
      errors.push({ field: 'main.gfa', message: 'GFA exceeds reasonable maximum (1,000,000 m²)' });
    }

    // Levels validation
    if (typeof amountOfLevels !== 'number' || !isFinite(amountOfLevels) ||
        amountOfLevels <= 0 || !Number.isInteger(amountOfLevels)) {
      errors.push({ field: 'main.amountOfLevels', message: 'Amount of levels must be a positive integer' });
    } else if (amountOfLevels > 200) {
      errors.push({ field: 'main.amountOfLevels', message: 'Amount of levels exceeds reasonable maximum (200)' });
    }

    // Floor height validations
    if (floorToFloorHeight !== undefined) {
      if (typeof floorToFloorHeight !== 'number' || !isFinite(floorToFloorHeight) || floorToFloorHeight <= 0) {
        errors.push({ field: 'main.floorToFloorHeight', message: 'Floor to floor height must be a positive finite number' });
      } else if (floorToFloorHeight > 10) {
        errors.push({ field: 'main.floorToFloorHeight', message: 'Floor height exceeds reasonable maximum (10m)' });
      }
    }

    if (floorToFloorHeightGroundFloor !== undefined) {
      if (typeof floorToFloorHeightGroundFloor !== 'number' || !isFinite(floorToFloorHeightGroundFloor) ||
          floorToFloorHeightGroundFloor <= 0) {
        errors.push({
          field: 'main.floorToFloorHeightGroundFloor',
          message: 'Ground floor height must be a positive finite number'
        });
      } else if (floorToFloorHeightGroundFloor > 15) {
        errors.push({
          field: 'main.floorToFloorHeightGroundFloor',
          message: 'Ground floor height exceeds reasonable maximum (15m)'
        });
      }
    }
  }

  // Validate sLayers section
  if (!buildingData.sLayers || !Array.isArray(buildingData.sLayers)) {
    errors.push({ field: 'sLayers', message: 'Missing or invalid "sLayers" array' });
  } else {
    if (buildingData.sLayers.length > 100) {
      errors.push({ field: 'sLayers', message: 'Too many systems (max 100)' });
    }

    buildingData.sLayers.forEach((system, index) => {
      // Validate system ID
      if (!system.id || typeof system.id !== 'string') {
        errors.push({ field: `sLayers[${index}].id`, message: 'System must have a valid string id' });
      } else if (system.id.length > 100) {
        errors.push({ field: `sLayers[${index}].id`, message: 'System id too long (max 100 chars)' });
      } else if (!/^[a-zA-Z0-9\s\-_.]+$/.test(system.id)) {
        errors.push({ field: `sLayers[${index}].id`, message: 'System id contains invalid characters' });
      }

      if (!Array.isArray(system.layers)) {
        errors.push({ field: `sLayers[${index}].layers`, message: 'System must have a layers array' });
      } else {
        if (system.layers.length > 100) {
          errors.push({ field: `sLayers[${index}].layers`, message: 'Too many layers in system (max 100)' });
        }

        system.layers.forEach((layer, layerIndex) => {
          // Validate layer ID
          if (!layer.id || typeof layer.id !== 'string') {
            errors.push({
              field: `sLayers[${index}].layers[${layerIndex}].id`,
              message: 'Layer must have a valid string id',
            });
          } else if (layer.id.length > 100) {
            errors.push({
              field: `sLayers[${index}].layers[${layerIndex}].id`,
              message: 'Layer id too long (max 100 chars)',
            });
          } else if (!/^[a-zA-Z0-9\s\-_.]+$/.test(layer.id)) {
            errors.push({
              field: `sLayers[${index}].layers[${layerIndex}].id`,
              message: 'Layer id contains invalid characters',
            });
          }

          // Validate quantities
          const hasArea = layer.area !== undefined && layer.area !== null;
          const hasLength = layer.length !== undefined && layer.length !== null;

          if (!hasArea && !hasLength) {
            errors.push({
              field: `sLayers[${index}].layers[${layerIndex}]`,
              message: 'Layer must have either area or length',
            });
          }

          if (hasArea) {
            if (typeof layer.area !== 'number' || !isFinite(layer.area) || layer.area < 0) {
              errors.push({
                field: `sLayers[${index}].layers[${layerIndex}].area`,
                message: 'Area must be a non-negative finite number',
              });
            } else if (layer.area > 1000000) {
              errors.push({
                field: `sLayers[${index}].layers[${layerIndex}].area`,
                message: 'Area exceeds reasonable maximum (1,000,000 m²)',
              });
            }
          }

          if (hasLength) {
            if (typeof layer.length !== 'number' || !isFinite(layer.length) || layer.length < 0) {
              errors.push({
                field: `sLayers[${index}].layers[${layerIndex}].length`,
                message: 'Length must be a non-negative finite number',
              });
            } else if (layer.length > 100000) {
              errors.push({
                field: `sLayers[${index}].layers[${layerIndex}].length`,
                message: 'Length exceeds reasonable maximum (100,000 m)',
              });
            }
          }
        });
      }
    });
  }

  return errors;
}

/**
 * Calculates carbon emissions for a single layer
 */
function calculateLayerEmissions(
  layer: { id: string; area?: number; length?: number },
  emissionFactors: EmissionFactorsDatabase
): LayerCalculation | null {
  const emissionFactor = emissionFactors[layer.id];

  if (!emissionFactor) {
    logger.warn(`No emission factor found for layer: ${layer.id}`);
    return null;
  }

  let quantity: number;
  let unit: 'm²' | 'm';
  let totalEmissions: number;

  if (emissionFactor.unit === 'kgCO2e/m²' && layer.area !== undefined) {
    quantity = layer.area;
    unit = 'm²';
    totalEmissions = layer.area * emissionFactor.factor;
  } else if (emissionFactor.unit === 'kgCO2e/m' && layer.length !== undefined) {
    quantity = layer.length;
    unit = 'm';
    totalEmissions = layer.length * emissionFactor.factor;
  } else {
    logger.warn(`Mismatched units for layer: ${layer.id}`);
    return null;
  }

  return {
    id: layer.id,
    quantity,
    unit,
    emissionFactor: emissionFactor.factor,
    totalEmissions,
    material: emissionFactor.material,
  };
}

/**
 * Main calculation function for building carbon emissions
 */
export function calculateCarbonEmissions(
  buildingData: BuildingData,
  emissionFactors: EmissionFactorsDatabase
): CalculationResult {
  const systems: SystemCalculation[] = [];

  // Calculate emissions for each system
  buildingData.sLayers.forEach((system) => {
    const layerCalculations: LayerCalculation[] = [];

    system.layers.forEach((layer) => {
      const calculation = calculateLayerEmissions(layer, emissionFactors);
      if (calculation) {
        layerCalculations.push(calculation);
      }
    });

    const systemTotalEmissions = layerCalculations.reduce(
      (sum, layer) => sum + layer.totalEmissions,
      0
    );

    systems.push({
      systemId: system.id,
      layers: layerCalculations,
      totalEmissions: systemTotalEmissions,
    });
  });

  // Calculate totals
  const totalEmissions = systems.reduce((sum, system) => sum + system.totalEmissions, 0);
  const carbonIntensity = totalEmissions / buildingData.main.gfa;

  return {
    systems,
    totalEmissions,
    carbonIntensity,
    gfa: buildingData.main.gfa,
  };
}

/**
 * Escapes CSV values according to RFC 4180 standard
 */
function escapeCsvValue(value: string | number): string {
  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Exports calculation results as CSV
 */
export function exportToCSV(result: CalculationResult): string {
  let csv = 'System,Layer,Quantity,Unit,Emission Factor,Material,Total Emissions (kgCO2e)\n';

  result.systems.forEach((system) => {
    system.layers.forEach((layer) => {
      csv += [
        escapeCsvValue(system.systemId),
        escapeCsvValue(layer.id),
        layer.quantity.toFixed(2),
        escapeCsvValue(layer.unit),
        layer.emissionFactor,
        escapeCsvValue(layer.material),
        layer.totalEmissions.toFixed(2)
      ].join(',') + '\n';
    });
  });

  csv += '\n';
  csv += `Total Embodied Carbon,,,,,,"${result.totalEmissions.toFixed(2)} kgCO2e"\n`;
  csv += `Carbon Intensity,,,,,,"${result.carbonIntensity.toFixed(2)} kgCO2e/m²"\n`;
  csv += `Gross Floor Area,,,,,,"${result.gfa.toFixed(2)} m²"\n`;

  return csv;
}

/**
 * Downloads a file to the user's computer
 */
export function downloadFile(content: string, filename: string, contentType: string): void {
  try {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Cleanup after a delay to ensure download starts
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Failed to download file:', error);
    throw new Error('Failed to initiate download');
  }
}
