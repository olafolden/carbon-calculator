import React, { useCallback, useMemo, useState } from 'react';
import { Assessment, EmissionFactorsDatabase, ManualSystemInputs } from '../types';
import { exportToCSV, downloadFile } from '../utils/calculator';
import { DEFAULT_BENCHMARK } from '../config/benchmarks';
import EmissionFactorModal from './EmissionFactorModal';
import { ManualSystemInput } from './ManualSystemInput';

interface ResultsDisplayProps {
  assessment: Assessment;
  emissionFactors: EmissionFactorsDatabase | null;
  onUpdateEmissionFactors: (customFactors: EmissionFactorsDatabase) => void;
  onUpdateManualSystems: (manualSystems: ManualSystemInputs) => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = React.memo(
  ({ assessment, emissionFactors, onUpdateEmissionFactors, onUpdateManualSystems }) => {
  const result = assessment.result;
  const [showEmissionFactorModal, setShowEmissionFactorModal] = useState(false);

  const handleExportCSV = useCallback(() => {
    const csv = exportToCSV(result);
    downloadFile(csv, 'carbon-calculation.csv', 'text/csv');
  }, [result]);

  const handleExportJSON = useCallback(() => {
    const json = JSON.stringify(result, null, 2);
    downloadFile(json, 'carbon-calculation.json', 'application/json');
  }, [result]);

  // Memoize benchmark calculations
  const benchmarkStatus = useMemo(() => {
    const { low: benchmarkLow, high: benchmarkHigh } = DEFAULT_BENCHMARK;
    return {
      isLowCarbon: result.carbonIntensity < benchmarkLow,
      isTypical: result.carbonIntensity >= benchmarkLow && result.carbonIntensity <= benchmarkHigh,
      benchmarkLow,
      benchmarkHigh
    };
  }, [result.carbonIntensity]);

  const { isLowCarbon, isTypical, benchmarkLow, benchmarkHigh } = benchmarkStatus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Carbon Calculation Results: <span className="text-blue-600">{assessment.name}</span>
          </h2>
          {assessment.customEmissionFactors && (
            <p className="text-sm text-blue-600 mt-1">
              Custom emission factors applied
            </p>
          )}
        </div>
        <button
          onClick={() => setShowEmissionFactorModal(true)}
          disabled={!emissionFactors}
          className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
            emissionFactors
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={!emissionFactors ? 'Emission factors not loaded' : 'Customize emission factors for this assessment'}
        >
          Customize Emission Factors
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <p className="text-sm font-medium text-gray-500 uppercase">Total Embodied Carbon</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {result.totalEmissions.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">kgCO2e</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <p className="text-sm font-medium text-gray-500 uppercase">Carbon Intensity</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {result.carbonIntensity.toFixed(1)}
          </p>
          <p className="text-sm text-gray-500">kgCO2e/m² GFA</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <p className="text-sm font-medium text-gray-500 uppercase">Gross Floor Area</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {result.gfa.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">m²</p>
        </div>
      </div>

      {/* Manual Systems Input */}
      <ManualSystemInput
        currentValues={assessment.manualSystems || { spaceplan: 0, service: 0 }}
        gfa={result.gfa}
        onUpdate={onUpdateManualSystems}
      />

      {/* Benchmark Comparison */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Benchmark Comparison</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${
                isLowCarbon ? 'bg-green-500' : 'bg-gray-300'
              }`}
              role="presentation"
            />
            <span className="text-sm text-gray-700">
              {isLowCarbon && '✓ '}Low Carbon (&lt; {benchmarkLow} kgCO2e/m²)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${
                isTypical ? 'bg-yellow-500' : 'bg-gray-300'
              }`}
              role="presentation"
            />
            <span className="text-sm text-gray-700">
              {isTypical && '✓ '}Typical ({benchmarkLow}-{benchmarkHigh} kgCO2e/m²)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${
                !isLowCarbon && !isTypical ? 'bg-red-500' : 'bg-gray-300'
              }`}
              role="presentation"
            />
            <span className="text-sm text-gray-700">
              {!isLowCarbon && !isTypical && '✓ '}High Carbon (&gt; {benchmarkHigh} kgCO2e/m²)
            </span>
          </div>
        </div>
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p className="text-sm font-medium text-gray-900">
            Your building: <span className="text-blue-600">{result.carbonIntensity.toFixed(1)} kgCO2e/m²</span>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {isLowCarbon && 'Excellent! Your building has lower embodied carbon than typical office buildings.'}
            {isTypical && 'Your building falls within the typical range for office buildings.'}
            {!isLowCarbon && !isTypical && 'Your building has higher embodied carbon than typical. Consider design optimization.'}
          </p>
        </div>
      </div>

      {/* System Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Breakdown by System</h3>
        <div className="space-y-4">
          {result.systems.map((system) => {
            const percentage = (system.totalEmissions / result.totalEmissions) * 100;
            return (
              <div key={system.systemId}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-900">{system.systemId}</span>
                  <span className="text-sm text-gray-600">
                    {system.totalEmissions.toLocaleString()} kgCO2e ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* Layer details */}
                <div className="mt-3 ml-4 space-y-2">
                  {system.layers.map((layer, idx) => (
                    <div key={idx} className="text-sm text-gray-600 flex justify-between">
                      <span>
                        {layer.id} ({layer.quantity.toFixed(1)} {layer.unit})
                      </span>
                      <span>{layer.totalEmissions.toLocaleString()} kgCO2e</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleExportJSON}
          aria-label="Export calculation results as JSON file"
          className="flex-1 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Export as JSON
        </button>
        <button
          onClick={handleExportCSV}
          aria-label="Export calculation results as CSV file"
          className="flex-1 px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Export as CSV
        </button>
      </div>

      {/* Emission Factor Modal */}
      {showEmissionFactorModal && emissionFactors && (
        <EmissionFactorModal
          defaultFactors={emissionFactors}
          customFactors={assessment.customEmissionFactors}
          onSave={onUpdateEmissionFactors}
          onClose={() => setShowEmissionFactorModal(false)}
        />
      )}

      {/* Error state if modal opened but factors not available */}
      {showEmissionFactorModal && !emissionFactors && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
            <p className="text-gray-700 mb-4">Emission factors not available</p>
            <button
              onClick={() => setShowEmissionFactorModal(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    // Return false if props have changed (trigger re-render)
    return (
      prevProps.assessment.id === nextProps.assessment.id &&
      prevProps.assessment.result === nextProps.assessment.result &&
      prevProps.assessment.name === nextProps.assessment.name &&
      prevProps.assessment.customEmissionFactors === nextProps.assessment.customEmissionFactors &&
      prevProps.assessment.manualSystems === nextProps.assessment.manualSystems &&
      prevProps.emissionFactors === nextProps.emissionFactors &&
      prevProps.onUpdateEmissionFactors === nextProps.onUpdateEmissionFactors &&
      prevProps.onUpdateManualSystems === nextProps.onUpdateManualSystems
    );
  }
);

ResultsDisplay.displayName = 'ResultsDisplay';
