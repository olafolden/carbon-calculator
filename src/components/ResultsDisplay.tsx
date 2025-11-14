import React, { useCallback, useMemo } from 'react';
import { CalculationResult } from '../types';
import { exportToCSV, downloadFile } from '../utils/calculator';
import { DEFAULT_BENCHMARK } from '../config/benchmarks';

interface ResultsDisplayProps {
  result: CalculationResult;
  onReset: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = React.memo(({ result, onReset }) => {
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
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Carbon Calculation Results</h2>
        <button
          onClick={onReset}
          aria-label="Reset calculator and upload new file"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Upload New File
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
    </div>
  );
});

ResultsDisplay.displayName = 'ResultsDisplay';
